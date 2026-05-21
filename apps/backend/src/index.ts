import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createPluginConnection } from './shared/pluginConnection.js';
import { GenerateScenariosModule } from './generateScenarios/generateScenarios.module.js';
import { RefineIterationModule } from './refineIteration/refineIteration.module.js';

const HTTP_PORT = parseInt(process.env['MCP_HTTP_PORT'] ?? '3333', 10);

async function main(): Promise<void> {
  const connection = await createPluginConnection(HTTP_PORT);

  const server = new McpServer({
    name: 'impact-mapping-copilot',
    version: '0.1.0',
  });

  new GenerateScenariosModule(server, connection);
  new RefineIterationModule(server, connection);
  process.stderr.write(`[mcp] Mode: ${connection.isProxy() ? 'proxy' : 'primary'}\n`);

  // Termine le process quand la session Claude Code se ferme. Sans ca, le serveur
  // HTTP (port 3333) garde l'event loop vivant et le process survit en orphelin,
  // squattant le port et faisant echouer le MCP au redemarrage suivant (apres /clear).
  let shuttingDown = false;
  const shutdown = (reason: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    process.stderr.write(`[mcp] Shutdown (${reason})\n`);
    void connection.close().finally(() => process.exit(0));
  };

  // stdin ferme = transport stdio coupe par Claude Code (fin de session / clear).
  process.stdin.on('end', () => shutdown('stdin end'));
  process.stdin.on('close', () => shutdown('stdin close'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`[mcp] Fatal error: ${err}\n`);
  process.exit(1);
});
