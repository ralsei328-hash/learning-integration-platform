/**
 * Learning MCP Server
 * 
 * An MCP server that provides learning workflow capabilities.
 * Allows managing courses, tracking progress, and syncing learning data.
 */

const TOOLS = {
    add_course: {
        name: 'add_course',
        description: 'Add a new course to the learning platform',
        inputSchema: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Course title' },
                description: { type: 'string', description: 'Course description' },
                provider: { type: 'string', description: 'Course provider' },
                url: { type: 'string', description: 'Course URL' },
                category: { type: 'string', description: 'Course category' },
                tags: { type: 'array', description: 'Course tags' }
            },
            required: ['title']
        }
    },
    update_progress: {
        name: 'update_progress',
        description: 'Update learning progress for a course',
        inputSchema: {
            type: 'object',
            properties: {
                courseId: { type: 'string', description: 'Course ID' },
                completedLessons: { type: 'array', description: 'Completed lesson IDs' },
                totalLessons: { type: 'number', description: 'Total number of lessons' },
                percentage: { type: 'number', description: 'Completion percentage' },
                notes: { type: 'string', description: 'Progress notes' }
            },
            required: ['courseId']
        }
    },
    add_resource: {
        name: 'add_resource',
        description: 'Add a learning resource',
        inputSchema: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Resource title' },
                type: { type: 'string', description: 'Resource type (link, document, video, etc.)' },
                url: { type: 'string', description: 'Resource URL' },
                description: { type: 'string', description: 'Resource description' },
                category: { type: 'string', description: 'Resource category' },
                tags: { type: 'array', description: 'Resource tags' },
                courseId: { type: 'string', description: 'Associated course ID' }
            },
            required: ['title']
        }
    },
    sync_learning_data: {
        name: 'sync_learning_data',
        'description': 'Sync learning data with external systems',
        inputSchema: {
            type: 'object',
            properties: {
                courses: { type: 'array', description: 'Courses to sync' },
                progress: { type: 'array', description: 'Progress records to sync' },
                resources: { type: 'array', description: 'Resources to sync' }
            },
            required: []
        }
    },
    get_courses: {
        name: 'get_courses',
        description: 'Get all courses',
        inputSchema: {
            type: 'object',
            properties: {
                category: { type: 'string', description: 'Filter by category' },
                status: { type: 'string', description: 'Filter by status' }
            },
            required: []
        }
    },
    get_progress: {
        name: 'get_progress',
        description: 'Get progress for a specific course',
        inputSchema: {
            type: 'object',
            properties: {
                courseId: { type: 'string', description: 'Course ID' }
            },
            required: ['courseId']
        }
    }
};

async function handleToolCall(toolName, params) {
    switch (toolName) {
        case 'add_course':
            return {
                success: true,
                course: {
                    id: `course_${Date.now()}`,
                    title: params.title,
                    description: params.description || '',
                    provider: params.provider || 'unknown',
                    url: params.url || '',
                    category: params.category || 'uncategorized',
                    tags: params.tags || [],
                    createdAt: new Date().toISOString()
                }
            };
        case 'update_progress':
            return {
                success: true,
                progress: {
                    courseId: params.courseId,
                    completedLessons: params.completedLessons || [],
                    totalLessons: params.totalLessons || 0,
                    percentage: params.percentage || 0,
                    notes: params.notes || '',
                    lastUpdated: new Date().toISOString()
                }
            };
        case 'add_resource':
            return {
                success: true,
                resource: {
                    id: `resource_${Date.now()}`,
                    title: params.title,
                    type: params.type || 'link',
                    url: params.url || '',
                    description: params.description || '',
                    category: params.category || 'uncategorized',
                    tags: params.tags || [],
                    courseId: params.courseId || null,
                    createdAt: new Date().toISOString()
                }
            };
        case 'sync_learning_data':
            return {
                success: true,
                synced: {
                    courses: params.courses?.length || 0,
                    progress: params.progress?.length || 0,
                    resources: params.resources?.length || 0
                },
                timestamp: new Date().toISOString()
            };
        case 'get_courses':
            return {
                success: true,
                courses: [],
                count: 0
            };
        case 'get_progress':
            return {
                success: true,
                progress: null
            };
        default:
            throw new Error(`Unknown tool: ${toolName}`);
    }
}

export { TOOLS, handleToolCall };

if (import.meta.url === `file://${process.argv[1]}`) {
    import('http').then(http => {
        const server = http.createServer(async (req, res) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const parsed = JSON.parse(body || '{}');
                    if (parsed.method === 'tools/list') {
                        res.end(JSON.stringify({
                            jsonrpc: '2.0',
                            id: parsed.id,
                            result: { tools: Object.values(TOOLS) }
                        }));
                    } else if (parsed.method === 'tools/call') {
                        const result = await handleToolCall(parsed.params.name, parsed.params.arguments);
                        res.end(JSON.stringify({
                            jsonrpc: '2.0',
                            id: parsed.id,
                            result: { content: [{ type: 'text', text: JSON.stringify(result) }] }
                        }));
                    } else {
                        res.end(JSON.stringify({
                            jsonrpc: '2.0',
                            id: parsed.id,
                            error: { code: -32601, message: 'Method not found' }
                        }));
                    }
                } catch (error) {
                    res.end(JSON.stringify({
                        jsonrpc: '2.0',
                        id: null,
                        error: { code: -32000, message: error.message }
                    }));
                }
            });
        });
        const port = process.env.PORT || 3003;
        server.listen(port, () => {
            console.log(`Learning MCP Server running on port ${port}`);
        });
    });
}
