import { expect } from 'vitest';
import { TestApp } from '../../../../shared/test/e2e/testApp.js';
import type { ImpactMappingContext } from '../../../impactMappingContext.js';
import type {
  GetImpactMappingContextDSL,
  GetImpactMappingContextWhenNoneStoredDSL,
} from '../getImpactMappingContext.dsl.js';

export class GetImpactMappingContextE2eDriver implements GetImpactMappingContextDSL {
  private testApp!: TestApp;
  private result!: { content: Array<{ type: string; text: string }>; isError?: boolean };

  async givenTheServerIsRunning(): Promise<void> {
    this.testApp = await TestApp.startShared();
  }

  async givenBoardDataWasPreviouslyStored(data: ImpactMappingContext): Promise<void> {
    await fetch(`${this.testApp.httpBaseUrl}/board-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async whenClaudeCallsGetBoardData(): Promise<void> {
    this.result = await this.testApp.callMcpTool('get_board_data');
  }

  thenTheImpactMappingContextIsReturned(expected: ImpactMappingContext): void {
    expect(this.result.isError).toBeUndefined();
    const data = JSON.parse(this.result.content[0].text) as ImpactMappingContext;
    expect(data).toEqual(expected);
  }

  cleanup(): void {
    this.testApp?.reset();
  }
}

export class GetImpactMappingContextWhenNoneStoredE2eDriver implements GetImpactMappingContextWhenNoneStoredDSL {
  private testApp!: TestApp;
  private result!: { content: Array<{ type: string; text: string }>; isError?: boolean };

  async givenTheServerIsRunning(): Promise<void> {
    this.testApp = await TestApp.startShared();
  }

  givenNoBoardDataWasStored(): void {
    this.testApp.reset();
  }

  async whenClaudeCallsGetBoardData(): Promise<void> {
    this.result = await this.testApp.callMcpTool('get_board_data');
  }

  thenAnErrorIsReturned(): void {
    expect(this.result.isError).toBe(true);
  }

  cleanup(): void {
    this.testApp?.reset();
  }
}
