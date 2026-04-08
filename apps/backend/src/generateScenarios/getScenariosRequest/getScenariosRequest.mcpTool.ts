import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GetScenariosRequestRepository } from './getScenariosRequest.repository.js';
import { GetScenariosRequestUseCase } from './getScenariosRequest.useCase.js';

export class GetScenariosRequestMcpTool {
  constructor(server: McpServer, repository: GetScenariosRequestRepository) {
    const useCase = new GetScenariosRequestUseCase(repository);

    server.tool(
      'get_scenario_request',
      'Checks for a pending scenario generation request from the FigJam plugin. Returns the request (ruleId, ruleTitle) or { pending: false }. If pending, call get_board_data to get fresh context before generating scenarios.',
      {},
      () => {
        const request = useCase.execute();

        if (!request) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({ pending: false }) }],
          };
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              pending: true,
              ruleId: request.ruleId,
              ruleTitle: request.ruleTitle,
            }, null, 2),
          }],
        };
      },
    );
  }
}
