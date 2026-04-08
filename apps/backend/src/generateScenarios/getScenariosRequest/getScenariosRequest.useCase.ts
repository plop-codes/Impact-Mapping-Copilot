import type { GetScenariosRequestRepository, ScenarioRequest } from './getScenariosRequest.repository.js';

export class GetScenariosRequestUseCase {
  constructor(private readonly repository: GetScenariosRequestRepository) {}

  execute(): ScenarioRequest | null {
    return this.repository.get();
  }
}
