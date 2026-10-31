#!/usr/bin/env node
/**
 * Learning Integration Platform - CLI Interface
 * 
 * Command-line interface for managing the platform.
 */

import { Command } from 'commander';
import { ConfigManager } from '../config/manager.js';
import { MCPDiscovery } from '../mcp/discovery.js';
import { MCPClient } from '../mcp/client.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('CLI');
const program = new Command();

program
    .name('lip')
    .description('Learning Integration Platform CLI')
    .version('1.0.0');

program
    .command('discover')
    .description('Discover available MCP servers')
    .action(async () => {
        const config = new ConfigManager();
        await config.load();
        const discovery = new MCPDiscovery(config);
        const servers = await discovery.discover();
        console.log(JSON.stringify(servers, null, 2));
    });

program
    .command('connect')
    .description('Connect to an MCP server')
    .argument('<name>', 'Server name')
    .action(async (name) => {
        const config = new ConfigManager();
        await config.load();
        const discovery = new MCPDiscovery(config);
        const servers = await discovery.discover();
        const server = servers.find(s => s.name === name);
        if (!server) {
            console.error(`Server not found: ${name}`);
            process.exit(1);
        }
        const client = new MCPClient(config);
        await client.connect(server);
        console.log(`Connected to ${name}`);
    });

program
    .command('status')
    .description('Show platform status')
    .action(async () => {
        const config = new ConfigManager();
        await config.load();
        const discovery = new MCPDiscovery(config);
        const servers = await discovery.discover();
        console.log(`Discovered MCP servers: ${servers.length}`);
        servers.forEach(s => console.log(`  - ${s.name} (${s.type})`));
    });

program
    .command('serve')
    .description('Start the MCP server')
    .option('-p, --port <port>', 'Port to listen on', '3000')
    .action(async (options) => {
        const config = new ConfigManager();
        await config.load();
        config.set('server.port', parseInt(options.port));
        const { MCPServer } = await import('../mcp/server.js');
        const server = new MCPServer(config);
        await server.start();
        console.log(`MCP server running on port ${options.port}`);
    });

program
    .command('init')
    .description('Initialize platform configuration')
    .action(async () => {
        const config = new ConfigManager();
        await config.load();
        await config.save();
        console.log('Configuration initialized');
    });

program.parse();
