import type { IterationRefinementRequest } from '../iterationRefinementRequest.js';

export type { IterationRefinementRequest };

export interface StoreIterationRefinementRequestRepository {
  store(request: IterationRefinementRequest): void;
}
