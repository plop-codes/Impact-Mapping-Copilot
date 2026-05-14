import { expect } from 'vitest';
import { TestApp } from '../../../../shared/test/e2e/testApp.js';
import type { ScenarioRequest } from '../../../scenarioRequest.js';
import type {
  GetScenariosRequestWhenPendingDSL,
  GetScenariosRequestWhenNonePendingDSL,
} from '../getScenariosRequest.dsl.js';

export class GetScenariosRequestWhenPendingE2eDriver implements GetScenariosRequestWhenPendingDSL {
  private testApp!: TestApp;
  private result!: { content: Array<{ type: string; text: string }>; isError?: boolean };

  async givenTheServerIsRunning(): Promise<void> {
    this.testApp = await TestApp.startShared();
  }

  async givenAScenarioRequestWasSent(request: ScenarioRequest): Promise<void> {
    await fetch(`${this.testApp.httpBaseUrl}/scenario-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  async whenClaudeCallsGetScenarioRequest(): Promise<void> {
    this.result = await this.testApp.callMcpTool('get_scenario_request');
  }

  thenThePendingRequestIsReturned(expected: ScenarioRequest): void {
    const data = JSON.parse(this.result.content[0].text);
    expect(data).toEqual(expect.objectContaining({
      pending: true,
      ruleId: expected.ruleId,
      ruleTitle: expected.ruleTitle,
    }));
  }
}

export class GetScenariosRequestWhenNonePendingE2eDriver implements GetScenariosRequestWhenNonePendingDSL {
  private testApp!: TestApp;
  private result!: { content: Array<{ type: string; text: string }>; isError?: boolean };

  async givenTheServerIsRunning(): Promise<void> {
    this.testApp = await TestApp.startShared();
  }

  async givenNoScenarioRequestIsPending(): Promise<void> {
    await fetch(`${this.testApp.httpBaseUrl}/__internal/scenario-request/clear`, {
      method: 'POST',
    });
  }

  async whenClaudeCallsGetScenarioRequest(): Promise<void> {
    this.result = await this.testApp.callMcpTool('get_scenario_request');
  }

  thenNoPendingRequestIsReturned(): void {
    const data = JSON.parse(this.result.content[0].text);
    expect(data).toEqual({ pending: false });
  }
}
