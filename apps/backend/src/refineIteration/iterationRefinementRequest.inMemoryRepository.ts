import type { IterationRefinementRequest } from './iterationRefinementRequest.js';
import type { StoreIterationRefinementRequestRepository } from './storeIterationRefinementRequest/storeIterationRefinementRequest.repository.js';
import type { GetIterationRefinementRequestRepository } from './getIterationRefinementRequest/getIterationRefinementRequest.repository.js';

export class IterationRefinementRequestInMemoryRepository
  implements StoreIterationRefinementRequestRepository, GetIterationRefinementRequestRepository
{
  private current: IterationRefinementRequest | null = null;

  store(request: IterationRefinementRequest): void {
    this.current = request;
  }

  get(): IterationRefinementRequest | null {
    return this.current;
  }

  clear(): void {
    this.current = null;
  }
}
