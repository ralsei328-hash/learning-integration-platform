/**
 * Learning Integration Platform - Core Platform Module
 * 
 * Orchestrates all platform components and manages lifecycle.
 */

import { Logger } from '../utils/logger.js';

const logger = new Logger('Platform');

export class Platform {
    constructor(modules) {
        this.config = modules.config;
        this.mcpClient = modules.mcpClient;
        this.mcpServer = modules.mcpServer;
        this.browsingManager = modules.browsingManager;
        this.learningManager = modules.learningManager;
        this.appConnector = modules.appConnector;
        this.discovery = modules.discovery;
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) {
            logger.warn('Platform is already running');
            return;
        }

        logger.info('Starting platform modules...');

        // Start MCP server
        await this.mcpServer.start();
        logger.info('MCP server started');

        // Start browsing manager
        await this.browsingManager.start();
        logger.info('Browsing manager started');

        // Start learning manager
        await this.learningManager.start();
        logger.info('Learning manager started');

        // Start app connector
        await this.appConnector.start();
        logger.info('App connector started');

        // Start MCP discovery watcher
        await this.discovery.watch();
        logger.info('MCP discovery watcher started');

        this.isRunning = true;
        logger.info('All platform modules started successfully');
    }

    async stop() {
        if (!this.isRunning) {
            return;
        }

        logger.info('Stopping platform modules...');

        // Stop discovery watcher
        await this.discovery.stop();

        // Stop app connector
        await this.appConnector.stop();

        // Stop learning manager
        await this.learningManager.stop();

        // Stop browsing manager
        await this.browsingManager.stop();

        // Stop MCP server
        await this.mcpServer.stop();

        // Disconnect MCP clients
        await this.mcpClient.disconnectAll();

        this.isRunning = false;
        logger.info('All platform modules stopped');
    }

    getModules() {
        return {
            config: this.config,
            mcpClient: this.mcpClient,
            mcpServer: this.mcpServer,
            browsingManager: this.browsingManager,
            learningManager: this.learningManager,
            appConnector: this.appConnector,
            discovery: this.discovery
        };
    }

    async getStatus() {
        return {
            isRunning: this.isRunning,
            mcpServers: this.mcpClient.getConnectedServers(),
            modules: {
                browsing: this.browsingManager.getStatus(),
                learning: this.learningManager.getStatus(),
                apps: this.appConnector.getStatus()
            }
        };
    }
}
