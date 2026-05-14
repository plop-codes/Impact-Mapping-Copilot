import type { Fetcher, GithubConfig, Logger } from './types';
import type { Issuable } from './issuable';
import { GithubApiError, githubFetch } from './githubApiError';
import {
  extractFigjamId,
  extractManualContent,
  formatBodyForMarkdown,
  wrapAutoBody,
} from './bodyMarkers';

export type IssueRef = {
  number: number;
  restId: number;
  nodeId: string;
};

export type ExistingIssue = IssueRef & {
  figjamId: string;
  body: string;
};

export class GithubClient {
  private readonly headers: Record<string, string>;
  private readonly apiBaseUrl: string;

  constructor(
    config: GithubConfig,
    private readonly fetcher: Fetcher,
    private readonly logger: Logger,
  ) {
    this.headers = {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    };
    this.apiBaseUrl = `https://api.github.com/repos/${config.owner}/${config.repo}`;
  }

  async listExistingIssuesByFigjamId(): Promise<Map<string, ExistingIssue>> {
    const byId = new Map<string, ExistingIssue>();
    let page = 1;
    const perPage = 100;
    while (true) {
      const res = await githubFetch(
        this.fetcher,
        `${this.apiBaseUrl}/issues?state=all&per_page=${perPage}&page=${page}`,
        { method: 'GET', headers: this.headers },
      );
      const items: Array<{
        number: number;
        id: number;
        node_id: string;
        body: string | null;
        pull_request?: unknown;
      }> = await res.json();
      if (items.length === 0) break;
      for (const item of items) {
        if (item.pull_request) continue;
        const body = item.body ?? '';
        const figjamId = extractFigjamId(body);
        if (!figjamId) continue;
        byId.set(figjamId, {
          number: item.number,
          restId: item.id,
          nodeId: item.node_id,
          figjamId,
          body,
        });
      }
      if (items.length < perPage) break;
      page++;
    }
    return byId;
  }

  async createIssue(issuable: Issuable, milestoneNumber?: number): Promise<IssueRef> {
    const wrapped = wrapAutoBody(issuable.figjamId, formatBodyForMarkdown(issuable.body));
    const payload: Record<string, unknown> = { title: issuable.title, body: wrapped };
    if (issuable.labels.length > 0) payload.labels = issuable.labels;
    if (milestoneNumber) payload.milestone = milestoneNumber;
    const res = await githubFetch(this.fetcher, `${this.apiBaseUrl}/issues`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    });
    const data: { number: number; id: number; node_id: string } = await res.json();
    return { number: data.number, restId: data.id, nodeId: data.node_id };
  }

  async updateIssue(
    existing: ExistingIssue,
    issuable: Issuable,
    milestoneNumber?: number,
  ): Promise<void> {
    const manualContent = extractManualContent(existing.body);
    const wrapped =
      wrapAutoBody(issuable.figjamId, formatBodyForMarkdown(issuable.body)) + manualContent;
    const payload: Record<string, unknown> = { title: issuable.title, body: wrapped };
    if (issuable.labels.length > 0) payload.labels = issuable.labels;
    if (milestoneNumber) payload.milestone = milestoneNumber;
    try {
      await githubFetch(this.fetcher, `${this.apiBaseUrl}/issues/${existing.number}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (error instanceof GithubApiError) {
        this.logger(`Update #${existing.number} echoue : ${error.message}`, 'error');
        return;
      }
      throw error;
    }
  }

  async ensureLabels(labelNames: string[]): Promise<void> {
    if (labelNames.length === 0) return;
    const existingNames = new Set<string>();
    const res = await githubFetch(this.fetcher, `${this.apiBaseUrl}/labels?per_page=100`, {
      method: 'GET',
      headers: this.headers,
    });
    const labels: Array<{ name: string }> = await res.json();
    for (const label of labels) existingNames.add(label.name);

    for (const name of labelNames) {
      if (existingNames.has(name)) continue;
      try {
        await githubFetch(this.fetcher, `${this.apiBaseUrl}/labels`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ name, color: '6B7280' }),
        });
      } catch (error) {
        if (error instanceof GithubApiError && error.status === 422) continue;
        if (error instanceof GithubApiError) {
          this.logger(`Creation label "${name}" echouee : ${error.message}`, 'error');
          continue;
        }
        throw error;
      }
    }
  }

  async ensureMilestones(milestoneNames: string[]): Promise<Record<string, number>> {
    const byName: Record<string, number> = {};
    if (milestoneNames.length === 0) return byName;

    const res = await githubFetch(
      this.fetcher,
      `${this.apiBaseUrl}/milestones?state=open&per_page=100`,
      { method: 'GET', headers: this.headers },
    );
    const existing: Array<{ number: number; title: string }> = await res.json();
    for (const m of existing) byName[m.title] = m.number;

    for (const name of milestoneNames) {
      if (byName[name]) continue;
      try {
        const createRes = await githubFetch(this.fetcher, `${this.apiBaseUrl}/milestones`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ title: name }),
        });
        const data: { number: number } = await createRes.json();
        byName[name] = data.number;
      } catch (error) {
        if (error instanceof GithubApiError) {
          this.logger(`Creation milestone "${name}" echouee : ${error.message}`, 'error');
          continue;
        }
        throw error;
      }
    }
    return byName;
  }

  async linkSubIssue(parentNumber: number, childRestId: number): Promise<'linked' | 'already' | 'unsupported' | 'error'> {
    try {
      await githubFetch(
        this.fetcher,
        `${this.apiBaseUrl}/issues/${parentNumber}/sub_issues`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ sub_issue_id: childRestId }),
        },
      );
      return 'linked';
    } catch (error) {
      if (error instanceof GithubApiError) {
        if (error.status === 422) return 'already';
        if (error.status === 404) return 'unsupported';
        this.logger(`Sub-issue link ${childRestId} -> #${parentNumber} : ${error.message}`, 'error');
        return 'error';
      }
      throw error;
    }
  }
}
