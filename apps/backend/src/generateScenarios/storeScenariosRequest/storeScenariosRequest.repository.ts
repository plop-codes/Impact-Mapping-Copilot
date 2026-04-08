import type { ScenarioRequest } from '../scenarioRequest.js';

export type { ScenarioRequest };

export interface StoreScenariosRequestRepository {
  store(request: ScenarioRequest): void;
}
