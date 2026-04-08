import { expect } from 'vitest';
import { TestApp } from '../../../../shared/test/e2e/testApp.js';
import type { ScenarioRequest } from '../../../scenarioRequest.js';
import type { StoreScenariosRequestDSL } from '../storeScenariosRequest.dsl.js';

export class StoreScenariosRequestE2eDriver implements StoreScenariosRequestDSL {
  private testApp!: TestApp;
  private response!: Response;

  async givenTheServerIsRunning(): Promise<void> {
    this.testApp = await TestApp.startShared();
  }

  async whenThePluginSendsAScenarioRequest(request: ScenarioRequest): Promise<void> {
    this.response = await fetch(`${this.testApp.httpBaseUrl}/scenario-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  async thenTheScenarioRequestIsStored(expected: ScenarioRequest): Promise<void> {
    expect(this.response.status).toBe(200);

    const result = await this.testApp.callMcpTool('get_scenario_request');
    const data = JSON.parse(result.content[0].text);
    expect(data).toEqual(expect.objectContaining({
      pending: true,
      ruleId: expected.ruleId,
      ruleTitle: expected.ruleTitle,
    }));
  }
}
