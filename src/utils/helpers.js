/**
 * Learning Integration Platform - Helper Utilities
 * 
 * Shared utility functions used across the platform.
 */

import fs from 'fs/promises';
import path from 'path';

export class Helpers {
    static async ensureDir(dirPath) {
        await fs.mkdir(dirPath, { recursive: true });
    }

    static async writeJson(filePath, data) {
        const dir = path.dirname(filePath);
        await this.ensureDir(dir);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }

    static async readJson(filePath, defaultValue = null) {
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch {
            return defaultValue;
        }
    }

    static generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    static formatTimestamp(date = new Date()) {
        return date.toISOString();
    }

    static parseTags(tagString) {
        if (!tagString) return [];
        return tagString.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }

    static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static deepMerge(target, source) {
        const output = { ...target };
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (key in target) {
                        output[key] = this.deepMerge(target[key], source[key]);
                    } else {
                        output[key] = source[key];
                    }
                } else {
                    output[key] = source[key];
                }
            }
        }
        return output;
    }

    static isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    static truncate(str, maxLength = 100) {
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength - 3) + '...';
    }
}
