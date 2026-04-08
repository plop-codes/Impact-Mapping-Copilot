import { scenarioRequests } from '../scenarioRequests.inMemoryStore.js';
import type { GetScenariosRequestRepository, ScenarioRequest } from './getScenariosRequest.repository.js';

export class GetScenariosRequestInMemoryRepository implements GetScenariosRequestRepository {
  get(): ScenarioRequest | null {
    return scenarioRequests.value;
  }
}
