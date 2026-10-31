/**
 * Learning Integration Platform - MCP Server Discovery
 * 
 * Automatically discovers MCP servers on the system by scanning:
 * - Local mcp-servers directory
 * - System-wide MCP server installations
 * - Node.js global packages
 * - Configuration files
 */

import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../utils/logger.js';

const logger = new Logger('MCPDiscovery');

export class MCPDiscovery {
    constructor(config) {
        this.config = config;
        this.serversPath = config.get('mcp.serversPath', './mcp-servers');
        this.configPath = config.get('mcp.configPath', './config/mcp.json');
        this.watchInterval = config.get('mcp.watchInterval', 30000);
        this.discoveredServers = [];
        this.watcher = null;
        this.isWatching = false;
    }

    async discover() {
        logger.info('Starting MCP server discovery...');
        this.discoveredServers = [];

        // 1. Discover from local mcp-servers directory
        await this._discoverFromDirectory(this.serversPath);

        // 2. Discover from system-wide locations
        await this._discoverFromSystem();

        // 3. Discover from npm global packages
        await this._discoverFromNpmGlobal();

        // 4. Discover from config file
        await this._discoverFromConfig();

        // 5. Discover from environment variables
        await this._discoverFromEnv();

        logger.info(`Discovery complete. Found ${this.discoveredServers.length} MCP servers`);
        return this.discoveredServers;
    }

    async _discoverFromDirectory(dirPath) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const serverPath = path.join(dirPath, entry.name);
                    const server = await this._parseServerManifest(serverPath);
                    if (server) {
                        this._addServer(server);
                    }
                }
            }
            logger.debug(`Discovered servers from ${dirPath}`);
        } catch (error) {
            logger.debug(`No servers found in ${dirPath}: ${error.message}`);
        }
    }

    async _discoverFromSystem() {
        const systemPaths = [
            path.join(process.env.LOCALAPPDATA || '', 'MCP', 'servers'),
            path.join(process.env.APPDATA || '', 'MCP', 'servers'),
            '/usr/local/lib/mcp/servers',
            '/opt/mcp/servers'
        ];

        for (const sysPath of systemPaths) {
            if (sysPath) {
                await this._discoverFromDirectory(sysPath);
            }
        }
    }

    async _discoverFromNpmGlobal() {
        try {
            const globalPath = path.dirname(process.execPath);
            const npmGlobalPath = path.join(globalPath, 'node_modules', 'mcp-servers');
            await this._discoverFromDirectory(npmGlobalPath);
        } catch (error) {
            logger.debug(`No global MCP servers found: ${error.message}`);
        }
    }

    async _discoverFromConfig() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf-8');
            const config = JSON.parse(configData);
            if (config.servers && Array.isArray(config.servers)) {
                for (const server of config.servers) {
                    this._addServer({
                        name: server.name || path.basename(server.path || ''),
                        type: 'config',
                        path: server.path,
                        command: server.command,
                        args: server.args || [],
                        env: server.env || {},
                        config: server.config || {}
                    });
                }
            }
            logger.debug('Discovered servers from config file');
        } catch (error) {
            logger.debug(`No MCP config file found: ${error.message}`);
        }
    }

    async _discoverFromEnv() {
        // Check for MCP_SERVERS environment variable (JSON array)
        if (process.env.MCP_SERVERS) {
            try {
                const servers = JSON.parse(process.env.MCP_SERVERS);
                for (const server of servers) {
                    this._addServer(server);
                }
                logger.debug('Discovered servers from MCP_SERVERS env var');
            } catch (error) {
                logger.warn(`Failed to parse MCP_SERVERS env var: ${error.message}`);
            }
        }
    }

    async _parseServerManifest(serverPath) {
        try {
            const manifestPath = path.join(serverPath, 'mcp.json');
            const packagePath = path.join(serverPath, 'package.json');

            let manifest = {};
            try {
                const manifestData = await fs.readFile(manifestPath, 'utf-8');
                manifest = JSON.parse(manifestData);
            } catch {
                // Try package.json
                try {
                    const pkgData = await fs.readFile(packagePath, 'utf-8');
                    const pkg = JSON.parse(pkgData);
                    manifest = {
                        name: pkg.name,
                        version: pkg.version,
                        description: pkg.description,
                        command: 'node',
                        args: [path.join(serverPath, pkg.main || 'index.js')]
                    };
                } catch {
                    return null;
                }
            }

            return {
                name: manifest.name || path.basename(serverPath),
                version: manifest.version || '1.0.0',
                description: manifest.description || '',
                type: 'local',
                path: serverPath,
                command: manifest.command || 'node',
                args: manifest.args || [],
                env: manifest.env || {},
                config: manifest.config || {}
            };
        } catch (error) {
            logger.debug(`Failed to parse manifest for ${serverPath}: ${error.message}`);
            return null;
        }
    }

    _addServer(server) {
        // Avoid duplicates
        const exists = this.discoveredServers.find(s => s.name === server.name);
        if (!exists) {
            this.discoveredServers.push(server);
            logger.debug(`Added MCP server: ${server.name}`);
        }
    }

    async watch() {
        if (this.isWatching) return;
        this.isWatching = true;

        logger.info('Starting MCP server discovery watcher...');

        this.watcher = setInterval(async () => {
            try {
                const servers = await this.discover();
                logger.debug(`Watcher: ${servers.length} servers discovered`);
            } catch (error) {
                logger.warn(`Watcher error: ${error.message}`);
            }
        }, this.watchInterval);

        logger.info(`Watcher started with ${this.watchInterval}ms interval`);
    }

    stop() {
        if (this.watcher) {
            clearInterval(this.watcher);
            this.watcher = null;
        }
        this.isWatching = false;
        logger.info('MCP discovery watcher stopped');
    }

    getServers() {
        return this.discoveredServers;
    }
}
