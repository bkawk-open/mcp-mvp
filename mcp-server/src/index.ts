import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_BASE_URL = process.env.MCP_API_URL || 'https://api.mcp-mvp.bkawk.com';

const server = new McpServer({
  name: 'mcp-mvp',
  version: '1.0.0',
});

server.tool(
  'get_user_profile',
  'Fetches a user profile by ID. Available IDs are 1 through 5.',
  { userId: z.string().describe('The user ID to look up (1-5)') },
  async ({ userId }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${data.error || 'Unknown error'}` }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Error: Failed to reach API - ${err}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'list_users',
  'Lists all available user profiles.',
  {},
  async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      const data = await response.json();

      if (!response.ok) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${data.error || 'Unknown error'}` }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Error: Failed to reach API - ${err}` }],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
