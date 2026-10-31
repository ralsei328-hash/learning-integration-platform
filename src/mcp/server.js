/**
 * Learning Integration Platform - MCP Server
 * 
 * Implements an MCP server that exposes platform functionality
 * to other MCP clients and tools.
 */

import express from 'express';
import { Logger } from '../utils/logger.js';

const logger = new Logger('MCPServer');

export class MCPServer {
    constructor(config) {
        this.config = config;
        this.app = express();
        this.server = null;
        this.port = config.get('server.port', 3000);
        this.host = config.get('server.host', 'localhost');
        this.tools = new Map();
        this.resources = new Map();
        this._registerDefaultTools();
    }

    _registerDefaultTools() {
        // Register platform tools that can be called via MCP
        this.tools.set('get_platform_status', {
            name: 'get_platform_status',
            description: 'Get the current status of the Learning Integration Platform',
            inputSchema: {
                type: 'object',
                properties: {},
                required: []
            },
            handler: async () => {
                return {
                    status: 'running',
                    timestamp: new Date().toISOString(),
                    version: '1.0.0'
                };
            }
        });

        this.tools.set('list_mcp_servers', {
            name: 'list_mcp_servers',
            description: 'List all discovered and connected MCP servers',
            inputSchema: {
                type: 'object',
                properties: {},
                required: []
            },
            handler: async (params, context) => {
                return context.mcpClient ? context.mcpClient.getConnectedServers() : [];
            }
        });

        this.tools.set('list_available_tools', {
            name: 'list_available_tools',
            description: 'List all available tools from connected MCP servers',
            inputSchema: {
                type: 'object',
                properties: {},
                required: []
            },
            handler: async (params, context) => {
                return context.mcpClient ? context.mcpClient.getAvailableTools() : [];
            }
        });

        this.tools.set('call_mcp_tool', {
            name: 'call_mcp_tool',
            description: 'Call a tool on a connected MCP server',
            inputSchema: {
                type: 'object',
                properties: {
                    serverId: { type: 'string', description: 'The MCP server ID' },
                    toolName: { type: 'string', description: 'The tool name to call' },
                    params: { type: 'object', description: 'Parameters for the tool' }
                },
                required: ['serverId', 'toolName']
            },
            handler: async (params, context) => {
                if (!context.mcpClient) {
                    throw new Error('MCP client not available');
                }
                return await context.mcpClient.callTool(
                    params.serverId,
                    params.toolName,
                    params.params || {}
                );
            }
        });

        this.tools.set('read_mcp_resource', {
            name: 'read_mcp_resource',
            description: 'Read a resource from a connected MCP server',
            inputSchema: {
                type: 'object',
                properties: {
                    serverId: { type: 'string', description: 'The MCP server ID' },
                    uri: { type: 'string', description: 'The resource URI to read' }
                },
                required: ['serverId', 'uri']
            },
            handler: async (params, context) => {
                if (!context.mcpClient) {
                    throw new Error('MCP client not available');
                }
                return await context.mcpClient.readResource(params.serverId, params.uri);
            }
        });

        logger.info(`Registered ${this.tools.size} default MCP tools`);
    }

    async start() {
        this.app.use(express.json());

        // MCP-compatible endpoints
        this.app.get('/mcp', (req, res) => {
            res.json({
                name: 'learning-integration-platform',
                version: '1.0.0',
                description: 'A centralized platform for browsing, learning, and educational workflows',
                tools: Array.from(this.tools.values()).map(t => ({
                    name: t.name,
                    description: t.description,
                    inputSchema: t.inputSchema
                })),
                resources: Array.from(this.resources.values())
            });
        });

        this.app.post('/mcp/tools/:toolName', async (req, res) => {
            const tool = this.tools.get(req.params.toolName);
            if (!tool) {
                return res.status(404).json({ error: `Tool not found: ${req.params.toolName}` });
            }

            try {
                const result = await tool.handler(req.body || {}, {
                    mcpClient: this._getMcpClient()
                });
                res.json(result);
            } catch (error) {
                logger.error(`Tool execution error: ${error.message}`);
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/mcp/resources/:resourceId', async (req, res) => {
            const resource = this.resources.get(req.params.resourceId);
            if (!resource) {
                return res.status(404).json({ error: `Resource not found: ${req.params.resourceId}` });
            }

            try {
                const content = await resource.handler();
                res.json({ uri: resource.uri, content });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });

        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, this.host, () => {
                logger.info(`MCP server listening on http://${this.host}:${this.port}`);
                resolve();
            });
            this.server.on('error', reject);
        });
    }

    _getMcpClient() {
        // This would be set by the platform when available
        return this._mcpClient || null;
    }

    setMcpClient(client) {
        this._mcpClient = client;
    }

    registerTool(tool) {
        this.tools.set(tool.name, tool);
        logger.debug(`Registered tool: ${tool.name}`);
    }

    registerResource(resource) {
        this.resources.set(resource.id, resource);
        logger.debug(`Registered resource: ${resource.id}`);
    }

    async stop() {
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    logger.info('MCP server stopped');
                    resolve();
                });
            });
        }
    }

    getTools() {
        return Array.from(this.tools.values());
    }

    getResources() {
        return Array.from(this.resources.values());
    }
}
