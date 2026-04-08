import { expect } from 'vitest';
import WebSocket from 'ws';
import { TestApp } from '../../../../shared/test/e2e/testApp.js';
import type { ScenarioRequest } from '../../../scenarioRequest.js';
import type { SubmitScenariosDSL } from '../submitScenarios.dsl.js';

export class SubmitScenariosE2eDriver implements SubmitScenariosDSL {
  private testApp!: TestApp;
  private ws!: WebSocket;
  private receivedMessages: unknown[] = [];
  private messageReceived!: Promise<void>;

  async givenTheServerIsRunning(): Promise<void> {
    this.testApp = await TestApp.startShared();
  }

  async givenThePluginIsConnectedViaWebSocket(): Promise<void> {
    this.ws = new WebSocket(this.testApp.wsUrl);

    let resolveMessage: () => void;
    this.messageReceived = new Promise((resolve) => {
      resolveMessage = resolve;
    });

    this.ws.on('message', (data: WebSocket.RawData) => {
      this.receivedMessages.push(JSON.parse(data.toString()));
      resolveMessage();
    });

    await new Promise<void>((resolve) => {
      this.ws.on('open', resolve);
    });
  }

  async givenAScenarioRequestIsPending(request: ScenarioRequest): Promise<void> {
    await fetch(`${this.testApp.httpBaseUrl}/scenario-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  async whenClaudeSubmitsScenarios(ruleId: string, scenarios: { title: string }[]): Promise<void> {
    await this.testApp.callMcpTool('submit_scenarios', { ruleId, scenarios });
  }

  async thenThePluginReceivesTheScenarios(expected: {
    type: string;
    ruleId: string;
    scenarios: { title: string }[];
  }): Promise<void> {
    await this.messageReceived;
    expect(this.receivedMessages).toContainEqual(expected);
  }

  async thenTheScenarioRequestIsRemoved(): Promise<void> {
    const result = await this.testApp.callMcpTool('get_scenario_request');
    const data = JSON.parse(result.content[0].text);
    expect(data).toEqual({ pending: false });
  }

  cleanup(): void {
    this.ws?.close();
  }
}
