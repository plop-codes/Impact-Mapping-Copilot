import type { ScenarioRequest } from '../../scenarioRequest.js';

export interface GetScenariosRequestWhenPendingDSL {
  givenTheServerIsRunning(): Promise<void>;
  givenAScenarioRequestWasSent(request: ScenarioRequest): Promise<void>;
  whenClaudeCallsGetScenarioRequest(): Promise<void>;
  thenThePendingRequestIsReturned(expected: ScenarioRequest): void;
}

export interface GetScenariosRequestWhenNonePendingDSL {
  givenTheServerIsRunning(): Promise<void>;
  givenNoScenarioRequestIsPending(): Promise<void>;
  whenClaudeCallsGetScenarioRequest(): Promise<void>;
  thenNoPendingRequestIsReturned(): void;
}
