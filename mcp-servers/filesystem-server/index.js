/**
 * Filesystem MCP Server
 * 
 * An MCP server that provides filesystem access capabilities.
 * Allows reading, writing, and listing files within allowed paths.
 */

import fs from 'fs/promises';
import path from 'path';

const ALLOWED_PATHS = process.env.ALLOWED_PATHS 
    ? process.env.ALLOWED_PATHS.split(path.delimiter) 
    : ['./data'];

const TOOLS = {
    read_file: {
        name: 'read_file',
        description: 'Read a file from the filesystem',
        inputSchema: {
            type: 'object',
            properties: {
                filePath: { type: 'string', description: 'Path to the file to read' }
            },
            required: ['filePath']
        }
    },
    write_file: {
        name: 'write_file',
        description: 'Write content to a file',
        inputSchema: {
            type: 'object',
            properties: {
                filePath: { type: 'string', description: 'Path to the file to write' },
                content: { type: 'string', description: 'Content to write to the file' }
            },
            required: ['filePath', 'content']
        }
    },
    list_files: {
        name: 'list_files',
        description: 'List files in a directory',
        inputSchema: {
            type: 'object',
            properties: {
                dirPath: { type: 'string', description: 'Path to the directory to list' }
            },
            required: ['dirPath']
        }
    },
    create_directory: {
        name: 'create_directory',
        description: 'Create a directory',
        inputSchema: {
            type: 'object',
            properties: {
                dirPath: { type: 'string', description: 'Path to the directory to create' }
            },
            required: ['dirPath']
        }
    }
};

function isPathAllowed(filePath) {
    const resolvedPath = path.resolve(filePath);
    return ALLOWED_PATHS.some(allowed => {
        const resolvedAllowed = path.resolve(allowed);
        return resolvedPath.startsWith(resolvedAllowed);
    });
}

async function handleToolCall(toolName, params) {
    switch (toolName) {
        case 'read_file': {
            if (!isPathAllowed(params.filePath)) {
                throw new Error('Access denied: path not in allowed paths');
            }
            const content = await fs.readFile(params.filePath, 'utf-8');
            return { content, filePath: params.filePath };
        }
        case 'write_file': {
            if (!isPathAllowed(params.filePath)) {
                throw new Error('Access denied: path not in allowed paths');
            }
            await fs.mkdir(path.dirname(params.filePath), { recursive: true });
            await fs.writeFile(params.filePath, params.content);
            return { success: true, filePath: params.filePath };
        }
        case 'list_files': {
            if (!isPathAllowed(params.dirPath)) {
                throw new Error('Access denied: path not in allowed paths');
            }
            const entries = await fs.readdir(params.dirPath, { withFileTypes: true });
            return entries.map(e => ({
                name: e.name,
                type: e.isDirectory() ? 'directory' : 'file'
            }));
        }
        case 'create_directory': {
            if (!isPathAllowed(params.dirPath)) {
                throw new Error('Access denied: path not in allowed paths');
            }
            await fs.mkdir(params.dirPath, { recursive: true });
            return { success: true, dirPath: params.dirPath };
        }
        default:
            throw new Error(`Unknown tool: ${toolName}`);
    }
}

// MCP Server Protocol Implementation
async function handleRequest(req, res) {
    res.setHeader('Content-Type', 'application/json');
    
    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        
        if (body.method === 'tools/list') {
            res.end(JSON.stringify({
                jsonrpc: '2.0',
                id: body.id,
                result: {
                    tools: Object.values(TOOLS)
                }
            }));
        } else if (body.method === 'tools/call') {
            const result = await handleToolCall(body.params.name, body.params.arguments);
            res.end(JSON.stringify({
                jsonrpc: '2.0',
                id: body.id,
                result: {
                    content: [{ type: 'text', text: JSON.stringify(result) }]
                }
            }));
        } else if (body.method === 'resources/list') {
            res.end(JSON.stringify({
                jsonrpc: '2.0',
                id: body.id,
                result: { resources: [] }
            }));
        } else {
            res.end(JSON.stringify({
                jsonrpc: '2.0',
                id: body.id,
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
}

// Export for use as module
export { TOOLS, handleToolCall, isPathAllowed };

// If run directly, start a simple HTTP server
if (import.meta.url === `file://${process.argv[1]}`) {
    import('http').then(http => {
        const server = http.createServer(async (req, res) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                req.body = body;
                handleRequest(req, res);
            });
        });
        const port = process.env.PORT || 3001;
        server.listen(port, () => {
            console.log(`Filesystem MCP Server running on port ${port}`);
        });
    });
}
