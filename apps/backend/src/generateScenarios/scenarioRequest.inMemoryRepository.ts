import type { ScenarioRequest } from './scenarioRequest.js';
import type { StoreScenariosRequestRepository } from './storeScenariosRequest/storeScenariosRequest.repository.js';
import type { GetScenariosRequestRepository } from './getScenariosRequest/getScenariosRequest.repository.js';

export class ScenarioRequestInMemoryRepository
  implements StoreScenariosRequestRepository, GetScenariosRequestRepository
{
  private current: ScenarioRequest | null = null;

  store(request: ScenarioRequest): void {
    this.current = request;
  }

  get(): ScenarioRequest | null {
    return this.current;
  }

  clear(): void {
    this.current = null;
  }
}
