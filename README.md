# Learning Integration Platform

A centralized platform that integrates and connects various apps to streamline browsing, learning, and educational workflows using the **Model Context Protocol (MCP)**.

## Architecture Overview

```
learning-integration-platform/
├── src/
│   ├── index.js              # Main entry point
│   ├── config/               # Configuration management
│   ├── mcp/                  # MCP server discovery & integration
│   │   ├── discovery.js      # Auto-discover MCP servers
│   │   ├── server.js         # MCP server implementation
│   │   ├── client.js         # MCP client for external servers
│   │   └── registry.js       # MCP server registry
│   ├── browsing/             # Web browsing integration
│   │   ├── capture.js        # Capture browsing sessions
│   │   ├── bookmarks.js      # Bookmark management
│   │   └── history.js        # Browsing history sync
│   ├── learning/             # Learning workflow tools
│   │   ├── sync.js           # Sync learning data
│   │   ├── courses.js        # Course management
│   │   └── progress.js       # Progress tracking
│   ├── apps/                 # App integration layer
│   │   ├── connect.js        # Connect to local apps
│   │   ├── telegram.js       # Telegram integration
│   │   └── gemini.js         # Gemini integration
│   ├── utils/                # Shared utilities
│   │   ├── logger.js         # Logging utility
│   │   └── helpers.js        # Helper functions
│   └── cli/                  # CLI interface
│       └── cli.js            # Command-line interface
├── config/
│   ├── mcp.json              # MCP server configuration
│   └── platform.json         # Platform configuration
├── mcp-servers/              # Local MCP server implementations
│   ├── filesystem-server/    # Filesystem MCP server
│   ├── browser-server/       # Browser MCP server
│   └── learning-server/      # Learning MCP server
├── data/                     # Data storage
│   ├── bookmarks/
│   ├── courses/
│   └── sessions/
├── tests/                    # Test files
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Key Features

1. **MCP Server Discovery**: Automatically discovers and connects to MCP servers on the system
2. **Browsing Integration**: Captures and syncs browsing sessions, bookmarks, and history
3. **Learning Workflow**: Manages courses, tracks progress, and syncs learning data
4. **App Integration**: Connects to local applications (Telegram, Gemini, etc.)
5. **Unified Interface**: Single platform to access all integrated tools

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start the platform
npm start

# Or use the CLI
npm run cli -- --help
```

## MCP Integration

The platform uses MCP to:
- Discover available MCP servers on the system
- Connect to external MCP servers for extended functionality
- Expose local data and tools through MCP-compatible interfaces
- Bridge different applications through a unified MCP layer

## License

MIT
