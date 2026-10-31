/**
 * Learning Integration Platform - MCP Client
 * 
 * Connects to and manages connections with external MCP servers.
 * Provides a unified interface for interacting with all connected MCP servers.
 */

import { Logger } from '../utils/logger.js';

const logger = new Logger('MCPClient');

export class MCPClient {
    constructor(config) {
        this.config = config;
        this.connections = new Map();
        this.tools = new Map();
    }

    async connect(server) {
        const serverId = server.name || server.path;
        
        if (this.connections.has(serverId)) {
            logger.debug(`Already connected to MCP server: ${serverId}`);
            return this.connections.get(serverId);
        }

        logger.info(`Connecting to MCP server: ${serverId}`);

        try {
            // In a real implementation, this would use the MCP SDK
            // to establish a connection with the MCP server
            const connection = {
                id: serverId,
                name: server.name,
                type: server.type,
                path: server.path,
                command: server.command,
                args: server.args,
                env: server.env,
                connected: true,
                connectedAt: new Date().toISOString(),
                tools: []
            };

            // Simulate tool discovery from the server
            connection.tools = await this._discoverTools(server);

            this.connections.set(serverId, connection);

            // Register tools
            for (const tool of connection.tools) {
                this.tools.set(`${serverId}:${tool.name}`, {
                    ...tool,
                    serverId,
                    serverName: server.name
                });
            }

            logger.info(`Connected to MCP server: ${serverId} (${connection.tools.length} tools)`);
            return connection;
        } catch (error) {
            logger.error(`Failed to connect to MCP server ${serverId}: ${error.message}`);
            throw error;
        }
    }

    async _discoverTools(server) {
        // In a real implementation, this would call the MCP server's
        // list_tools method to discover available tools
        const defaultTools = [
            { name: 'read_resource', description: 'Read a resource from the server', inputSchema: {} },
            { name: 'write_resource', description: 'Write a resource to the server', inputSchema: {} },
            { name: 'list_resources', description: 'List available resources', inputSchema: {} },
            { name: 'call_tool', description: 'Call a tool on the server', inputSchema: {} }
        ];

        // If the server has a manifest, try to read its tools
        try {
            const manifestPath = path.join(server.path, 'mcp.json');
            const manifestData = await fs.readFile(manifestPath, 'utf-8');
            const manifest = JSON.parse(manifestData);
            if (manifest.tools && Array.isArray(manifest.tools)) {
                return manifest.tools;
            }
        } catch {
            // Use default tools
        }

        return defaultTools;
    }

    async callTool(serverId, toolName, params = {}) {
        const connection = this.connections.get(serverId);
        if (!connection || !connection.connected) {
            throw new Error(`Not connected to MCP server: ${serverId}`);
        }

        logger.debug(`Calling tool ${toolName} on server ${serverId}`);

        // In a real implementation, this would use the MCP SDK
        // to call the tool on the connected server
        return {
            success: true,
            serverId,
            toolName,
            params,
            result: `Tool ${toolName} called on ${serverId}`
        };
    }

    async readResource(serverId, uri) {
        const connection = this.connections.get(serverId);
        if (!connection || !connection.connected) {
            throw new Error(`Not connected to MCP server: ${serverId}`);
        }

        logger.debug(`Reading resource ${uri} from server ${serverId}`);

        // In a real implementation, this would use the MCP SDK
        return {
            success: true,
            serverId,
            uri,
            content: `Resource content for ${uri}`
        };
    }

    async writeResource(serverId, uri, content) {
        const connection = this.connections.get(serverId);
        if (!connection || !connection.connected) {
            throw new Error(`Not connected to MCP server: ${serverId}`);
        }

        logger.debug(`Writing resource ${uri} to server ${serverId}`);

        return {
            success: true,
            serverId,
            uri,
            content
        };
    }

    getConnectedServers() {
        return Array.from(this.connections.values()).map(conn => ({
            id: conn.id,
            name: conn.name,
            type: conn.type,
            connected: conn.connected,
            connectedAt: conn.connectedAt,
            toolCount: conn.tools.length
        }));
    }

    getAvailableTools() {
        return Array.from(this.tools.values());
    }

    getToolsForServer(serverId) {
        return Array.from(this.tools.values()).filter(t => t.serverId === serverId);
    }

    async disconnect(serverId) {
        const connection = this.connections.get(serverId);
        if (connection) {
            connection.connected = false;
            this.connections.delete(serverId);
            logger.info(`Disconnected from MCP server: ${serverId}`);
        }
    }

    async disconnectAll() {
        for (const serverId of this.connections.keys()) {
            await this.disconnect(serverId);
        }
        this.tools.clear();
        logger.info('All MCP connections disconnected');
    }
}
