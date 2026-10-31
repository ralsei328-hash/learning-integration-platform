/**
 * Learning Integration Platform - Learning Manager
 * 
 * Manages learning workflows including:
 * - Course management
 * - Progress tracking
 * - Learning data synchronization
 * - Resource organization
 */

import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../utils/logger.js';

const logger = new Logger('LearningManager');

export class LearningManager {
    constructor(config, mcpClient) {
        this.config = config;
        this.mcpClient = mcpClient;
        this.dataPath = config.get('learning.dataPath', './data/learning');
        this.courses = new Map();
        this.progress = new Map();
        this.resources = [];
        this.isRunning = false;
    }

    async start() {
        logger.info('Starting learning manager...');
        await fs.mkdir(this.dataPath, { recursive: true });
        await this._loadState();
        this.isRunning = true;
        logger.info('Learning manager started');
    }

    async stop() {
        if (!this.isRunning) return;
        await this._saveState();
        this.isRunning = false;
        logger.info('Learning manager stopped');
    }

    async _loadState() {
        try {
            const coursesData = await fs.readFile(
                path.join(this.dataPath, 'courses.json'), 'utf-8'
            );
            const courses = JSON.parse(coursesData);
            for (const course of courses) {
                this.courses.set(course.id, course);
            }

            const progressData = await fs.readFile(
                path.join(this.dataPath, 'progress.json'), 'utf-8'
            );
            const progress = JSON.parse(progressData);
            for (const p of progress) {
                this.progress.set(p.courseId, p);
            }

            const resourcesData = await fs.readFile(
                path.join(this.dataPath, 'resources.json'), 'utf-8'
            );
            this.resources = JSON.parse(resourcesData);

            logger.info(`Loaded ${this.courses.size} courses, ${this.progress.size} progress records, ${this.resources.length} resources`);
        } catch (error) {
            logger.debug('No existing learning state found, starting fresh');
        }
    }

    async _saveState() {
        try {
            await fs.writeFile(
                path.join(this.dataPath, 'courses.json'),
                JSON.stringify(Array.from(this.courses.values()), null, 2)
            );
            await fs.writeFile(
                path.join(this.dataPath, 'progress.json'),
                JSON.stringify(Array.from(this.progress.values()), null, 2)
            );
            await fs.writeFile(
                path.join(this.dataPath, 'resources.json'),
                JSON.stringify(this.resources, null, 2)
            );
            logger.debug('Learning state saved');
        } catch (error) {
            logger.error(`Failed to save learning state: ${error.message}`);
        }
    }

    async addCourse(courseData) {
        const course = {
            id: courseData.id || `course_${Date.now()}`,
            title: courseData.title,
            description: courseData.description || '',
            provider: courseData.provider || 'unknown',
            url: courseData.url || '',
            category: courseData.category || 'uncategorized',
            tags: courseData.tags || [],
            createdAt: new Date().toISOString(),
            startDate: courseData.startDate || null,
            dueDate: courseData.dueDate || null,
            status: courseData.status || 'not-started',
            ...courseData
        };

        this.courses.set(course.id, course);
        await this._saveState();
        logger.info(`Added course: ${course.title}`);
        return course;
    }

    async updateProgress(courseId, progressData) {
        const existing = this.progress.get(courseId) || {
            courseId,
            completedLessons: [],
            totalLessons: 0,
            percentage: 0,
            lastUpdated: null
        };

        existing.completedLessons = [
            ...new Set([...existing.completedLessons, ...(progressData.completedLessons || [])])
        ];
        existing.totalLessons = progressData.totalLessons || existing.totalLessons;
        existing.percentage = progressData.percentage || 
            (existing.totalLessons > 0 
                ? Math.round((existing.completedLessons.length / existing.totalLessons) * 100) 
                : 0);
        existing.lastUpdated = new Date().toISOString();
        existing.notes = progressData.notes || existing.notes;

        this.progress.set(courseId, existing);
        await this._saveState();
        logger.info(`Updated progress for course ${courseId}: ${existing.percentage}%`);
        return existing;
    }

    async addResource(resourceData) {
        const resource = {
            id: `resource_${Date.now()}`,
            title: resourceData.title,
            type: resourceData.type || 'link',
            url: resourceData.url || '',
            description: resourceData.description || '',
            category: resourceData.category || 'uncategorized',
            tags: resourceData.tags || [],
            courseId: resourceData.courseId || null,
            createdAt: new Date().toISOString()
        };

        this.resources.push(resource);
        await this._saveState();
        logger.info(`Added resource: ${resource.title}`);
        return resource;
    }

    async syncWithMCP() {
        if (!this.mcpClient) {
            logger.warn('MCP client not available for sync');
            return;
        }

        const servers = this.mcpClient.getConnectedServers();
        for (const server of servers) {
            try {
                const tools = this.mcpClient.getToolsForServer(server.id);
                for (const tool of tools) {
                    if (tool.name === 'sync_learning_data') {
                        await this.mcpClient.callTool(server.id, tool.name, {
                            courses: Array.from(this.courses.values()),
                            progress: Array.from(this.progress.values()),
                            resources: this.resources
                        });
                        logger.info(`Synced learning data with MCP server: ${server.name}`);
                    }
                }
            } catch (error) {
                logger.warn(`Failed to sync with MCP server ${server.name}: ${error.message}`);
            }
        }
    }

    getCourses() {
        return Array.from(this.courses.values());
    }

    getProgress(courseId) {
        return this.progress.get(courseId);
    }

    getResources() {
        return this.resources;
    }

    async searchResources(query) {
        const lowerQuery = query.toLowerCase();
        return this.resources.filter(r =>
            r.title.toLowerCase().includes(lowerQuery) ||
            r.description.toLowerCase().includes(lowerQuery) ||
            r.tags.some(t => t.toLowerCase().includes(lowerQuery))
        );
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            courses: this.courses.size,
            progressRecords: this.progress.size,
            resources: this.resources.length
        };
    }
}
