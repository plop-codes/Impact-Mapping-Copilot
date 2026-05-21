import type {
  GetIterationRefinementRequestRepository,
  IterationRefinementRequest,
} from './getIterationRefinementRequest.repository.js';

export class GetIterationRefinementRequestUseCase {
  constructor(private readonly repository: GetIterationRefinementRequestRepository) {}

  async execute(): Promise<IterationRefinementRequest | null> {
    return await this.repository.get();
  }
}
