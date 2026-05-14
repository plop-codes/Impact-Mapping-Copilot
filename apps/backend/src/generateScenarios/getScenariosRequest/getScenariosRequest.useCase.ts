import type { GetScenariosRequestRepository, ScenarioRequest } from './getScenariosRequest.repository.js';

export class GetScenariosRequestUseCase {
  constructor(private readonly repository: GetScenariosRequestRepository) {}

  async execute(): Promise<ScenarioRequest | null> {
    return await this.repository.get();
  }
}
