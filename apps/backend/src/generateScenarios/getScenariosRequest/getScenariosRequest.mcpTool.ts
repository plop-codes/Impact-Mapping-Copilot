import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GetScenariosRequestRepository } from './getScenariosRequest.repository.js';
import { GetScenariosRequestUseCase } from './getScenariosRequest.useCase.js';

export class GetScenariosRequestMcpTool {
  constructor(server: McpServer, repository: GetScenariosRequestRepository) {
    const useCase = new GetScenariosRequestUseCase(repository);

    server.tool(
      'get_scenario_request',
      'Checks for a pending scenario generation request from the FigJam plugin. Returns the request enriched with the impact mapping hierarchy (rule, userStory, action, impact, actor, objective, plus boundedContext and domain on the userStory) and the business glossary, or { pending: false } if no request is pending. Each rule may carry an `examples` array: these are the concrete examples discussed with the business during the impact mapping workshop (FigJam SCENARIO shapes attached under the rule) — they help understand the need, they are NOT ready-to-use test scenarios. All context needed to generate scenarios is included in the response — no need to read any board file.',
      {},
      async () => {
        const request = await useCase.execute();

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
              hierarchy: request.hierarchy ?? null,
              glossary: request.glossary ?? [],
            }, null, 2),
          }],
        };
      },
    );
  }
}
