import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PluginConnection } from '../shared/pluginConnection.js';
import { StoreScenariosRequestInMemoryRepository } from './storeScenariosRequest/storeScenariosRequest.inMemoryRepository.js';
import { StoreScenariosRequestHttpListener } from './storeScenariosRequest/storeScenariosRequest.httpListener.js';
import { GetScenariosRequestInMemoryRepository } from './getScenariosRequest/getScenariosRequest.inMemoryRepository.js';
import { GetScenariosRequestHttpRepository } from './getScenariosRequest/getScenariosRequest.httpRepository.js';
import { GetScenariosRequestMcpTool } from './getScenariosRequest/getScenariosRequest.mcpTool.js';
import { scenarioRequests } from './scenarioRequests.inMemoryStore.js';

export class GenerateScenariosModule {
  constructor(server: McpServer, connection: PluginConnection) {
    if (connection.isProxy()) {
      const port = connection.getPort();
      new GetScenariosRequestMcpTool(server, new GetScenariosRequestHttpRepository(port));
      return;
    }

    new StoreScenariosRequestHttpListener(connection, new StoreScenariosRequestInMemoryRepository());
    new GetScenariosRequestMcpTool(server, new GetScenariosRequestInMemoryRepository());

    connection.onPost('/__internal/scenario-request/get', (_body, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ request: scenarioRequests.value }));
    });

    connection.onPost('/__internal/scenario-request/clear', (_body, res) => {
      scenarioRequests.value = null;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}');
    });

    connection.onPost('/__internal/plugin/send', (body, res) => {
      try {
        const { message } = JSON.parse(body) as { message: unknown };
        connection.sendToPlugin(message);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{}');
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });

    connection.onPost('/__internal/plugin/is-connected', (_body, res) => {
      const connected = connection.isConnected();
      Promise.resolve(connected).then((c) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ connected: c }));
      });
    });
  }
}
