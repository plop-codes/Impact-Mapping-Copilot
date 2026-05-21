import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PluginConnection } from '../shared/pluginConnection.js';
import { IterationRefinementRequestInMemoryRepository } from './iterationRefinementRequest.inMemoryRepository.js';
import { StoreIterationRefinementRequestHttpListener } from './storeIterationRefinementRequest/storeIterationRefinementRequest.httpListener.js';
import { GetIterationRefinementRequestHttpRepository } from './getIterationRefinementRequest/getIterationRefinementRequest.httpRepository.js';
import { GetIterationRefinementRequestMcpTool } from './getIterationRefinementRequest/getIterationRefinementRequest.mcpTool.js';

export class RefineIterationModule {
  constructor(server: McpServer, connection: PluginConnection) {
    if (connection.isProxy()) {
      const port = connection.getPort();
      new GetIterationRefinementRequestMcpTool(server, new GetIterationRefinementRequestHttpRepository(port));
      return;
    }

    const repository = new IterationRefinementRequestInMemoryRepository();

    new StoreIterationRefinementRequestHttpListener(connection, repository);
    new GetIterationRefinementRequestMcpTool(server, repository);

    connection.onPost('/__internal/iteration-refinement-request/get', (_body, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ request: repository.get() }));
    });

    connection.onPost('/__internal/iteration-refinement-request/clear', (_body, res) => {
      repository.clear();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}');
    });
  }
}
