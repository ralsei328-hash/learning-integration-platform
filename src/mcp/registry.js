/**
 * Learning Integration Platform - MCP Server Registry
 * 
 * Maintains a registry of known MCP servers and their capabilities.
 * Provides lookup and management functions for MCP servers.
 */

import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../utils/logger.js';

const logger = new Logger('MCPRegistry');

export class MCPRegistry {
    constructor(config) {
        this.config = config;
        this.registryPath = config.get('mcp.configPath', './config/mcp.json');
        this.servers = new Map();
    }

    async load() {
        try {
            const data = await fs.readFile(this.registryPath, 'utf-8');
            const config = JSON.parse(data);
            if (config.servers) {
                for (const server of config.servers) {
                    this.servers.set(server.name, server);
                }
            }
            logger.info(`Loaded ${this.servers.size} servers from registry`);
        } catch (error) {
            logger.info('No existing registry found, starting fresh');
        }
    }

    async save() {
        const dir = path.dirname(this.registryPath);
        await fs.mkdir(dir, { recursive: true });

        const config = {
            servers: Array.from(this.servers.values())
        };

        await fs.writeFile(this.registryPath, JSON.stringify(config, null, 2));
        logger.info(`Saved ${this.servers.size} servers to registry`);
    }

    register(server) {
        this.servers.set(server.name, server);
        logger.debug(`Registered server: ${server.name}`);
    }

    unregister(name) {
        if (this.servers.delete(name)) {
            logger.debug(`Unregistered server: ${name}`);
            return true;
        }
        return false;
    }

    get(name) {
        return this.servers.get(name);
    }

    getAll() {
        return Array.from(this.servers.values());
    }

    getByType(type) {
        return Array.from(this.servers.values()).filter(s => s.type === type);
    }

    has(name) {
        return this.servers.has(name);
    }

    async update(name, updates) {
        const server = this.servers.get(name);
        if (!server) {
            throw new Error(`Server not found: ${name}`);
        }
        Object.assign(server, updates);
        this.servers.set(name, server);
        await this.save();
        logger.debug(`Updated server: ${name}`);
    }
}
