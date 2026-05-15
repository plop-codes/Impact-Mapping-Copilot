import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PluginConnection } from '../shared/pluginConnection.js';
import { ScenarioRequestInMemoryRepository } from './scenarioRequest.inMemoryRepository.js';
import { StoreScenariosRequestHttpListener } from './storeScenariosRequest/storeScenariosRequest.httpListener.js';
import { GetScenariosRequestHttpRepository } from './getScenariosRequest/getScenariosRequest.httpRepository.js';
import { GetScenariosRequestMcpTool } from './getScenariosRequest/getScenariosRequest.mcpTool.js';

export class GenerateScenariosModule {
  constructor(server: McpServer, connection: PluginConnection) {
    if (connection.isProxy()) {
      const port = connection.getPort();
      new GetScenariosRequestMcpTool(server, new GetScenariosRequestHttpRepository(port));
      return;
    }

    const repository = new ScenarioRequestInMemoryRepository();

    new StoreScenariosRequestHttpListener(connection, repository);
    new GetScenariosRequestMcpTool(server, repository);

    connection.onPost('/__internal/scenario-request/get', (_body, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ request: repository.get() }));
    });

    connection.onPost('/__internal/scenario-request/clear', (_body, res) => {
      repository.clear();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}');
    });
  }
}
