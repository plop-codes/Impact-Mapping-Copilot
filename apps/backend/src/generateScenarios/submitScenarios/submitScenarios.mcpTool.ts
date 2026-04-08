import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { PluginConnection } from '../../shared/pluginConnection.js';
import type { SubmitScenariosRepository } from './submitScenarios.repository.js';
import { WebsocketPluginNotifier } from './submitScenarios.websocketPluginNotifier.js';
import { SubmitScenariosUseCase } from './submitScenarios.useCase.js';

export class SubmitScenariosMcpTool {
  constructor(server: McpServer, connection: PluginConnection, repository: SubmitScenariosRepository) {
    const useCase = new SubmitScenariosUseCase(
      new WebsocketPluginNotifier(connection),
      repository,
    );

    server.tool(
      'submit_scenarios',
      'Submits generated scenarios back to the FigJam plugin. The plugin will create scenario shapes connected to the rule on the board.',
      {
        ruleId: z.string().describe('The FigJam node ID of the rule'),
        scenarios: z.array(z.object({
          title: z.string().describe('The scenario title (will be displayed in bold)'),
          body: z.string().optional().describe('The scenario body in Given/When/Then format'),
          testDrivers: z.array(z.string()).optional().describe('Test driver labels, e.g. ["backend-use-case", "backend-e2e", "ui"]'),
        })).describe('Array of scenarios to create'),
      },
      ({ ruleId, scenarios }) => {
        useCase.execute(ruleId, scenarios);
        return {
          content: [{ type: 'text' as const, text: `${scenarios.length} scénarios envoyés au plugin.` }],
        };
      },
    );
  }
}
