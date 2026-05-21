import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GetIterationRefinementRequestRepository } from './getIterationRefinementRequest.repository.js';
import { GetIterationRefinementRequestUseCase } from './getIterationRefinementRequest.useCase.js';

export class GetIterationRefinementRequestMcpTool {
  constructor(server: McpServer, repository: GetIterationRefinementRequestRepository) {
    const useCase = new GetIterationRefinementRequestUseCase(repository);

    server.tool(
      'get_user_stories_in_iteration_for_refinement',
      'Checks for a pending iteration-refinement request from the FigJam plugin (sent when the user selects a section and clicks "refine this iteration"). Returns all User Stories of the selected section sorted left-to-right (by x), each one carrying its full parent context (objective, actor, impact, action), its rules, and the business glossary, or { pending: false } if no request is pending. Each rule may carry an `examples` array: concrete examples discussed with the business during the impact mapping workshop (FigJam SCENARIO shapes attached under the rule) — they help understand the need, they are NOT ready-to-use test scenarios. All context needed to refine the stories is included — no need to read any board file.',
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
              section: request.section,
              userStories: request.userStories,
            }, null, 2),
          }],
        };
      },
    );
  }
}
