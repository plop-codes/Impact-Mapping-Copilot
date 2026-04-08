import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ImpactMappingContext } from '../impactMappingContext.js';
import { GetImpactMappingContextFileRepository } from './getImpactMappingContext.fileRepository.js';
import { GetImpactMappingContextUseCase } from './getImpactMappingContext.useCase.js';

export class GetImpactMappingContextMcpTool {
  constructor(server: McpServer) {
    const useCase = new GetImpactMappingContextUseCase(
      new GetImpactMappingContextFileRepository(),
    );

    server.tool(
      'get_board_data',
      'Returns the full board data: impact map hierarchy, context (product vision, actors, glossary), and warnings.',
      {},
      () => {
        const result = useCase.execute();

        if (result.isFailure()) {
          return {
            content: [{ type: 'text' as const, text: result.getError() }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(result.getValue<ImpactMappingContext>(), null, 2),
          }],
        };
      },
    );
  }
}
