# MCP MVP

A minimal MCP (Model Context Protocol) server that fetches user profiles from an API. Built as a learning exercise to understand MCP end-to-end.

## Architecture

```
mcp-server/   TypeScript MCP server (compiled to single JS bundle)
api/           Go Lambda with hardcoded user profiles
infra/         AWS CDK stack (API Gateway, S3, CloudFront, Route53)
```

The MCP server exposes two tools:

- **get_user_profile** - Fetches a user profile by ID (1-5)
- **list_users** - Lists all available user profiles

The API lives at `https://api.mcp-mvp.bkawk.com` and the compiled MCP server bundle is hosted at `https://mcp-mvp.bkawk.com/mcp-server.js`.

## Installation

### Claude Code

```bash
claude mcp add mcp-mvp -- npx -y mcp-mvp-server
```

### Claude Desktop

Add to `~/.config/Claude/claude_desktop_config.json` (Linux) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "mcp-mvp": {
      "command": "npx",
      "args": ["-y", "mcp-mvp-server"]
    }
  }
}
```

Restart Claude Desktop after saving.

### Test it

Ask Claude:

> "Get me the profile for user 1"

or

> "List all available users"

## API

The Go Lambda serves hardcoded user profiles:

```
GET https://api.mcp-mvp.bkawk.com/users      # List all users
GET https://api.mcp-mvp.bkawk.com/users/1     # Get user by ID (1-5)
```

Example response:

```json
{
  "id": "1",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "role": "Engineer",
  "joinedDate": "2023-01-15"
}
```

## Configuration

The MCP server reads the API URL from the `MCP_API_URL` environment variable. Defaults to `https://api.mcp-mvp.bkawk.com`.

To point at a different API:

```json
{
  "mcpServers": {
    "mcp-mvp": {
      "command": "npx",
      "args": ["-y", "mcp-mvp-server"],
      "env": {
        "MCP_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

## Development

```bash
# Build the MCP server
cd mcp-server && npm install && npm run build

# Build and deploy everything
cd mcp-server && npm install && npm run build
cd ../infra && npm install && AWS_PROFILE=bkawk npx cdk deploy
```
