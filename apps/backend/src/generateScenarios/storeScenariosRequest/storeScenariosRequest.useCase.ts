import type { ScenarioRequest, StoreScenariosRequestRepository } from './storeScenariosRequest.repository.js';

export class StoreScenariosRequestUseCase {
  constructor(private readonly repository: StoreScenariosRequestRepository) {}

  execute(request: ScenarioRequest): void {
    this.repository.store(request);
  }
}
