import type {
  IterationRefinementRequest,
  StoreIterationRefinementRequestRepository,
} from './storeIterationRefinementRequest.repository.js';

export class StoreIterationRefinementRequestUseCase {
  constructor(private readonly repository: StoreIterationRefinementRequestRepository) {}

  execute(request: IterationRefinementRequest): void {
    this.repository.store(request);
  }
}
