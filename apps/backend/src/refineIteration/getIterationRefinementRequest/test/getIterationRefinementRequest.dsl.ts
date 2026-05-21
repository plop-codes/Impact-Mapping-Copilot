import type { IterationRefinementRequest } from '../../iterationRefinementRequest.js';

export interface GetIterationRefinementRequestWhenPendingDSL {
  givenTheServerIsRunning(): Promise<void>;
  givenAnIterationRefinementRequestWasSent(request: IterationRefinementRequest): Promise<void>;
  whenClaudeCallsGetIterationRefinementRequest(): Promise<void>;
  thenThePendingRequestIsReturned(expected: IterationRefinementRequest): void;
}

export interface GetIterationRefinementRequestWhenNonePendingDSL {
  givenTheServerIsRunning(): Promise<void>;
  givenNoIterationRefinementRequestIsPending(): Promise<void>;
  whenClaudeCallsGetIterationRefinementRequest(): Promise<void>;
  thenNoPendingRequestIsReturned(): void;
}
