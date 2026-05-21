import { expect } from 'vitest';
import { TestApp } from '../../../../shared/test/e2e/testApp.js';
import type { IterationRefinementRequest } from '../../../iterationRefinementRequest.js';
import type {
  GetIterationRefinementRequestWhenPendingDSL,
  GetIterationRefinementRequestWhenNonePendingDSL,
} from '../getIterationRefinementRequest.dsl.js';

const TOOL = 'get_user_stories_in_iteration_for_refinement';

export class GetIterationRefinementRequestWhenPendingE2eDriver
  implements GetIterationRefinementRequestWhenPendingDSL
{
  private testApp!: TestApp;
  private result!: { content: Array<{ type: string; text: string }>; isError?: boolean };

  async givenTheServerIsRunning(): Promise<void> {
    this.testApp = await TestApp.startShared();
  }

  async givenAnIterationRefinementRequestWasSent(request: IterationRefinementRequest): Promise<void> {
    await fetch(`${this.testApp.httpBaseUrl}/iteration-refinement-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  async whenClaudeCallsGetIterationRefinementRequest(): Promise<void> {
    this.result = await this.testApp.callMcpTool(TOOL);
  }

  thenThePendingRequestIsReturned(expected: IterationRefinementRequest): void {
    const data = JSON.parse(this.result.content[0].text);
    expect(data).toEqual(expect.objectContaining({
      pending: true,
      section: expected.section,
      userStories: expected.userStories,
    }));
  }
}

export class GetIterationRefinementRequestWhenNonePendingE2eDriver
  implements GetIterationRefinementRequestWhenNonePendingDSL
{
  private testApp!: TestApp;
  private result!: { content: Array<{ type: string; text: string }>; isError?: boolean };

  async givenTheServerIsRunning(): Promise<void> {
    this.testApp = await TestApp.startShared();
  }

  async givenNoIterationRefinementRequestIsPending(): Promise<void> {
    await fetch(`${this.testApp.httpBaseUrl}/__internal/iteration-refinement-request/clear`, {
      method: 'POST',
    });
  }

  async whenClaudeCallsGetIterationRefinementRequest(): Promise<void> {
    this.result = await this.testApp.callMcpTool(TOOL);
  }

  thenNoPendingRequestIsReturned(): void {
    const data = JSON.parse(this.result.content[0].text);
    expect(data).toEqual({ pending: false });
  }
}
