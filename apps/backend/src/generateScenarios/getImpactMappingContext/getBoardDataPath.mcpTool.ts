import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BOARD_DATA_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  '.board-data.json',
);

export class GetBoardDataPathMcpTool {
  constructor(server: McpServer) {
    server.tool(
      'get_board_data_path',
      "Returns the absolute filesystem path to the .board-data.json file. Read this file directly to get the full board data without MCP response size limits.",
      {},
      () => ({
        content: [{ type: 'text' as const, text: BOARD_DATA_PATH }],
      }),
    );
  }
}
