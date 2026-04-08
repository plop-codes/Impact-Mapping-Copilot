import { expect } from 'vitest';
import { TestApp } from '../../../../shared/test/e2e/testApp.js';
import type { ImpactMappingContext } from '../../../impactMappingContext.js';
import type { StoreImpactMappingContextDSL } from '../storeImpactMappingContext.dsl.js';

export class StoreImpactMappingContextE2eDriver implements StoreImpactMappingContextDSL {
  private testApp!: TestApp;
  private response!: Response;

  async givenTheServerIsRunning(): Promise<void> {
    this.testApp = await TestApp.startShared();
  }

  async whenThePluginSendsBoardData(data: ImpactMappingContext): Promise<void> {
    this.response = await fetch(`${this.testApp.httpBaseUrl}/board-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async thenTheBoardDataIsStored(expected: ImpactMappingContext): Promise<void> {
    expect(this.response.status).toBe(200);

    const result = await this.testApp.callMcpTool('get_board_data');
    const stored = JSON.parse(result.content[0].text) as ImpactMappingContext;
    expect(stored).toEqual(expected);
  }

  cleanup(): void {
    this.testApp?.reset();
  }
}
