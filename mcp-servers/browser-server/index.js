/**
 * Browser MCP Server
 * 
 * An MCP server that provides browser automation capabilities.
 * Allows capturing browsing sessions, managing bookmarks, and accessing history.
 */

const TOOLS = {
    capture_session: {
        name: 'capture_session',
        description: 'Capture the current browser session',
        inputSchema: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'The URL to capture' },
                title: { type: 'string', description: 'The page title' },
                duration: { type: 'number', description: 'Time spent on page in seconds' }
            },
            required: ['url']
        }
    },
    add_bookmark: {
        name: 'add_bookmark',
        'description': 'Add a bookmark',
        inputSchema: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL to bookmark' },
                title: { type: 'string', description: 'Bookmark title' },
                category: { type: 'string', description: 'Bookmark category' },
                tags: { type: 'array', description: 'Bookmark tags' }
            },
            required: ['url', 'title']
        }
    },
    get_history: {
        name: 'get_history',
        description: 'Get browsing history',
        inputSchema: {
            type: 'object',
            properties: {
                limit: { type: 'number', description: 'Maximum number of entries' },
                since: { type: 'string', description: 'ISO date string for filtering' }
            },
            required: []
        }
    },
    search_bookmarks: {
        name: 'search_bookmarks',
        description: 'Search bookmarks by query',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search query' }
            },
            required: ['query']
        }
    }
};

async function handleToolCall(toolName, params) {
    switch (toolName) {
        case 'capture_session':
            return {
                success: true,
                session: {
                    url: params.url,
                    title: params.title || 'Untitled',
                    duration: params.duration || 0,
                    timestamp: new Date().toISOString()
                }
            };
        case 'add_bookmark':
            return {
                success: true,
                bookmark: {
                    url: params.url,
                    title: params.title,
                    category: params.category || 'uncategorized',
                    tags: params.tags || [],
                    createdAt: new Date().toISOString()
                }
            };
        case 'get_history':
            return {
                success: true,
                history: [],
                count: 0
            };
        case 'search_bookmarks':
            return {
                success: true,
                results: [],
                query: params.query
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
        const port = process.env.PORT || 3002;
        server.listen(port, () => {
            console.log(`Browser MCP Server running on port ${port}`);
        });
    });
}
