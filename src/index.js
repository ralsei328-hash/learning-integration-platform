/**
 * Learning Integration Platform - Main Entry Point
 * 
 * A centralized platform that integrates and connects various apps
 * to streamline browsing, learning, and educational workflows using MCP.
 */

import { Platform } from './core/platform.js';
import { MCPDiscovery } from './mcp/discovery.js';
import { MCPClient } from './mcp/client.js';
import { MCPServer } from './mcp/server.js';
import { BrowsingManager } from './browsing/manager.js';
import { LearningManager } from './learning/manager.js';
import { AppConnector } from './apps/connector.js';
import { Logger } from './utils/logger.js';
import { ConfigManager } from './config/manager.js';

const logger = new Logger('Main');

async function main() {
    logger.info('Starting Learning Integration Platform...');

    // Initialize configuration
    const config = new ConfigManager();
    await config.load();

    // Initialize MCP discovery and client
    const discovery = new MCPDiscovery(config);
    const mcpClient = new MCPClient(config);
    const mcpServer = new MCPServer(config);

    // Discover available MCP servers
    logger.info('Discovering MCP servers...');
    const servers = await discovery.discover();
    logger.info(`Found ${servers.length} MCP servers`);

    // Connect to discovered MCP servers
    for (const server of servers) {
        try {
            await mcpClient.connect(server);
            logger.info(`Connected to MCP server: ${server.name}`);
        } catch (error) {
            logger.warn(`Failed to connect to MCP server ${server.name}: ${error.message}`);
        }
    }

    // Initialize platform modules
    const browsingManager = new BrowsingManager(config, mcpClient);
    const learningManager = new LearningManager(config, mcpClient);
    const appConnector = new AppConnector(config, mcpClient);

    // Initialize the platform
    const platform = new Platform({
        config,
        mcpClient,
        mcpServer,
        browsingManager,
        learningManager,
        appConnector,
        discovery
    });

    // Start the platform
    await platform.start();

    logger.info('Learning Integration Platform is running!');
    logger.info('Use Ctrl+C to stop.');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        logger.info('Shutting down...');
        await platform.stop();
        process.exit(0);
    });
}

main().catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
});
