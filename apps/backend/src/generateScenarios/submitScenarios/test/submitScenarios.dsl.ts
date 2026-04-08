import type { ScenarioRequest } from '../../scenarioRequest.js';

export interface SubmitScenariosDSL {
  givenTheServerIsRunning(): Promise<void>;
  givenThePluginIsConnectedViaWebSocket(): Promise<void>;
  givenAScenarioRequestIsPending(request: ScenarioRequest): Promise<void>;
  whenClaudeSubmitsScenarios(ruleId: string, scenarios: { title: string }[]): Promise<void>;
  thenThePluginReceivesTheScenarios(expected: {
    type: string;
    ruleId: string;
    scenarios: { title: string }[];
  }): Promise<void>;
  thenTheScenarioRequestIsRemoved(): Promise<void>;
}
