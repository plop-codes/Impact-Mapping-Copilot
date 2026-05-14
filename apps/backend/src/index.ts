import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createPluginConnection } from './shared/pluginConnection.js';
import { GenerateScenariosModule } from './generateScenarios/generateScenarios.module.js';

const HTTP_PORT = parseInt(process.env['MCP_HTTP_PORT'] ?? '3333', 10);

async function main(): Promise<void> {
  const connection = await createPluginConnection(HTTP_PORT);

  const server = new McpServer({
    name: 'impact-mapping-copilot',
    version: '0.1.0',
  });

  new GenerateScenariosModule(server, connection);
  process.stderr.write(`[mcp] Mode: ${connection.isProxy() ? 'proxy' : 'primary'}\n`);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`[mcp] Fatal error: ${err}\n`);
  process.exit(1);
});
