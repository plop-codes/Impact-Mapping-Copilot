import type { IterationRefinementRequest } from '../iterationRefinementRequest.js';

export type { IterationRefinementRequest };

export interface GetIterationRefinementRequestRepository {
  get(): Promise<IterationRefinementRequest | null> | IterationRefinementRequest | null;
}
