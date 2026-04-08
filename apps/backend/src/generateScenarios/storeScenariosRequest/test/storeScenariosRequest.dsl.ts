import type { ScenarioRequest } from '../../scenarioRequest.js';

export interface StoreScenariosRequestDSL {
  givenTheServerIsRunning(): Promise<void>;
  whenThePluginSendsAScenarioRequest(request: ScenarioRequest): Promise<void>;
  thenTheScenarioRequestIsStored(expected: ScenarioRequest): Promise<void>;
}
