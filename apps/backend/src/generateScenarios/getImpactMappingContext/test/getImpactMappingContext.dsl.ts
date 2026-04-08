import type { ImpactMappingContext } from '../../impactMappingContext.js';

export interface GetImpactMappingContextDSL {
  givenTheServerIsRunning(): Promise<void>;
  givenBoardDataWasPreviouslyStored(data: ImpactMappingContext): Promise<void>;
  whenClaudeCallsGetBoardData(): Promise<void>;
  thenTheImpactMappingContextIsReturned(expected: ImpactMappingContext): void;
}

export interface GetImpactMappingContextWhenNoneStoredDSL {
  givenTheServerIsRunning(): Promise<void>;
  givenNoBoardDataWasStored(): void;
  whenClaudeCallsGetBoardData(): Promise<void>;
  thenAnErrorIsReturned(): void;
}
