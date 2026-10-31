/**
 * Learning Integration Platform - Browsing Manager
 * 
 * Manages web browsing integration including:
 * - Browsing session capture
 * - Bookmark management
 * - History synchronization
 * - Tab management
 */

import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../utils/logger.js';

const logger = new Logger('BrowsingManager');

export class BrowsingManager {
    constructor(config, mcpClient) {
        this.config = config;
        this.mcpClient = mcpClient;
        this.dataPath = config.get('browsing.dataPath', './data/browsing');
        this.sessions = new Map();
        this.bookmarks = [];
        this.history = [];
        this.isRunning = false;
    }

    async start() {
        logger.info('Starting browsing manager...');
        await fs.mkdir(this.dataPath, { recursive: true });
        await this._loadState();
        this.isRunning = true;
        logger.info('Browsing manager started');
    }

    async stop() {
        if (!this.isRunning) return;
        await this._saveState();
        this.isRunning = false;
        logger.info('Browsing manager stopped');
    }

    async _loadState() {
        try {
            const sessionsData = await fs.readFile(
                path.join(this.dataPath, 'sessions.json'), 'utf-8'
            );
            const sessions = JSON.parse(sessionsData);
            for (const session of sessions) {
                this.sessions.set(session.id, session);
            }

            const bookmarksData = await fs.readFile(
                path.join(this.dataPath, 'bookmarks.json'), 'utf-8'
            );
            this.bookmarks = JSON.parse(bookmarksData);

            const historyData = await fs.readFile(
                path.join(this.dataPath, 'history.json'), 'utf-8'
            );
            this.history = JSON.parse(historyData);

            logger.info(`Loaded ${this.sessions.size} sessions, ${this.bookmarks.length} bookmarks, ${this.history.length} history entries`);
        } catch (error) {
            logger.debug('No existing browsing state found, starting fresh');
        }
    }

    async _saveState() {
        try {
            await fs.writeFile(
                path.join(this.dataPath, 'sessions.json'),
                JSON.stringify(Array.from(this.sessions.values()), null, 2)
            );
            await fs.writeFile(
                path.join(this.dataPath, 'bookmarks.json'),
                JSON.stringify(this.bookmarks, null, 2)
            );
            await fs.writeFile(
                path.join(this.dataPath, 'history.json'),
                JSON.stringify(this.history, null, 2)
            );
            logger.debug('Browsing state saved');
        } catch (error) {
            logger.error(`Failed to save browsing state: ${error.message}`);
        }
    }

    async captureSession(sessionData) {
        const session = {
            id: sessionData.id || `session_${Date.now()}`,
            url: sessionData.url,
            title: sessionData.title,
            timestamp: new Date().toISOString(),
            duration: sessionData.duration || 0,
            tags: sessionData.tags || [],
            notes: sessionData.notes || '',
            ...sessionData
        };

        this.sessions.set(session.id, session);
        await this._saveState();
        logger.info(`Captured browsing session: ${session.title}`);
        return session;
    }

    async addBookmark(bookmarkData) {
        const bookmark = {
            id: `bookmark_${Date.now()}`,
            url: bookmarkData.url,
            title: bookmarkData.title,
            category: bookmarkData.category || 'uncategorized',
            tags: bookmarkData.tags || [],
            createdAt: new Date().toISOString(),
            notes: bookmarkData.notes || ''
        };

        this.bookmarks.push(bookmark);
        await this._saveState();
        logger.info(`Added bookmark: ${bookmark.title}`);
        return bookmark;
    }

    async addHistory(historyEntry) {
        const entry = {
            id: `history_${Date.now()}`,
            url: historyEntry.url,
            title: historyEntry.title,
            timestamp: new Date().toISOString(),
            visitCount: 1
        };

        const existing = this.history.find(h => h.url === entry.url);
        if (existing) {
            existing.visitCount += 1;
            existing.lastVisited = entry.timestamp;
        } else {
            this.history.push(entry);
        }

        await this._saveState();
        return entry;
    }

    getSessions() {
        return Array.from(this.sessions.values());
    }

    getBookmarks() {
        return this.bookmarks;
    }

    getHistory() {
        return this.history;
    }

    async searchBookmarks(query) {
        const lowerQuery = query.toLowerCase();
        return this.bookmarks.filter(b =>
            b.title.toLowerCase().includes(lowerQuery) ||
            b.url.toLowerCase().includes(lowerQuery) ||
            b.tags.some(t => t.toLowerCase().includes(lowerQuery))
        );
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            sessions: this.sessions.size,
            bookmarks: this.bookmarks.length,
            history: this.history.length
        };
    }
}
