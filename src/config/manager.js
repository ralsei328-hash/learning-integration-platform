/**
 * Learning Integration Platform - Configuration Manager
 * 
 * Manages platform configuration from environment variables and config files.
 */

import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../utils/logger.js';

const logger = new Logger('ConfigManager');

export class ConfigManager {
    constructor(configPath = './config/platform.json') {
        this.configPath = configPath;
        this.config = {};
        this.env = process.env;
    }

    async load() {
        logger.info('Loading configuration...');

        // Load from config file
        try {
            const configData = await fs.readFile(this.configPath, 'utf-8');
            this.config = JSON.parse(configData);
            logger.info('Configuration loaded from file');
        } catch (error) {
            logger.warn(`Config file not found at ${this.configPath}, using defaults`);
            this.config = this._getDefaultConfig();
        }

        // Override with environment variables
        this._applyEnvOverrides();

        logger.debug('Configuration:', JSON.stringify(this.config, null, 2));
        return this.config;
    }

    _getDefaultConfig() {
        return {
            mcp: {
                serversPath: process.env.MCP_SERVERS_PATH || './mcp-servers',
                configPath: process.env.MCP_CONFIG_PATH || './config/mcp.json',
                autoDiscover: true,
                watchInterval: 30000
            },
            browsing: {
                dataPath: process.env.BROWSER_DATA_PATH || './data/browsing',
                captureHistory: true,
                captureBookmarks: true,
                captureSessions: true
            },
            learning: {
                dataPath: process.env.LEARNING_DATA_PATH || './data/learning',
                syncInterval: 300000,
                trackProgress: true,
                syncCourses: true
            },
            apps: {
                telegram: {
                    enabled: !!process.env.TELEGRAM_BOT_TOKEN,
                    token: process.env.TELEGRAM_BOT_TOKEN
                },
                gemini: {
                    enabled: !!process.env.GEMINI_API_KEY,
                    apiKey: process.env.GEMINI_API_KEY
                }
            },
            server: {
                port: parseInt(process.env.PORT || '3000'),
                host: process.env.HOST || 'localhost'
            }
        };
    }

    _applyEnvOverrides() {
        if (process.env.PORT) {
            this.config.server = this.config.server || {};
            this.config.server.port = parseInt(process.env.PORT);
        }
        if (process.env.HOST) {
            this.config.server = this.config.server || {};
            this.config.server.host = process.env.HOST;
        }
        if (process.env.LOG_LEVEL) {
            this.config.logLevel = process.env.LOG_LEVEL;
        }
    }

    get(key, defaultValue = undefined) {
        const keys = key.split('.');
        let value = this.config;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return defaultValue;
            }
        }
        return value;
    }

    set(key, value) {
        const keys = key.split('.');
        let obj = this.config;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in obj)) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
    }

    async save() {
        const dir = path.dirname(this.configPath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
        logger.info('Configuration saved');
    }
}
