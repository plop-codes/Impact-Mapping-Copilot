import { scenarioRequests } from '../scenarioRequests.inMemoryStore.js';
import type { ScenarioRequest, StoreScenariosRequestRepository } from './storeScenariosRequest.repository.js';

export class StoreScenariosRequestInMemoryRepository implements StoreScenariosRequestRepository {
  store(request: ScenarioRequest): void {
    scenarioRequests.value = request;
  }
}
