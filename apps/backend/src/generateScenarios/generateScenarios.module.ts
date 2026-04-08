import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PluginConnection } from '../shared/pluginConnection.js';
import { StoreImpactMappingContextFileRepository } from './storeImpactMappingContext/storeImpactMappingContext.fileRepository.js';
import { StoreImpactMappingContextHttpListener } from './storeImpactMappingContext/storeImpactMappingContext.httpListener.js';
import { GetImpactMappingContextMcpTool } from './getImpactMappingContext/getImpactMappingContext.mcpTool.js';
import { StoreScenariosRequestInMemoryRepository } from './storeScenariosRequest/storeScenariosRequest.inMemoryRepository.js';
import { StoreScenariosRequestHttpListener } from './storeScenariosRequest/storeScenariosRequest.httpListener.js';
import { GetScenariosRequestInMemoryRepository } from './getScenariosRequest/getScenariosRequest.inMemoryRepository.js';
import { GetScenariosRequestMcpTool } from './getScenariosRequest/getScenariosRequest.mcpTool.js';
import { SubmitScenariosInMemoryRepository } from './submitScenarios/submitScenarios.inMemoryRepository.js';
import { SubmitScenariosMcpTool } from './submitScenarios/submitScenarios.mcpTool.js';

export class GenerateScenariosModule {
  constructor(server: McpServer, connection: PluginConnection) {

    new StoreImpactMappingContextHttpListener(connection, new StoreImpactMappingContextFileRepository());
    new GetImpactMappingContextMcpTool(server);

    new StoreScenariosRequestHttpListener(connection, new StoreScenariosRequestInMemoryRepository());
    new GetScenariosRequestMcpTool(server, new GetScenariosRequestInMemoryRepository());

    new SubmitScenariosMcpTool(server, connection, new SubmitScenariosInMemoryRepository());
  }
}
