import type { ScenarioRequest } from '../scenarioRequest.js';

export type { ScenarioRequest };

export interface GetScenariosRequestRepository {
  get(): ScenarioRequest | null;
}
