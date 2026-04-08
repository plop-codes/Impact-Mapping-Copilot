import type { IssuableElement } from '../issuableElement';
import type { GithubImageUploader } from './githubImageUploader';
import type { Fetcher, GithubConfig, Logger } from './githubTypes';
import { AutoBodyMarkers } from './autoBodyMarkers';

export class GithubIssueClient {
  private readonly headers: Record<string, string>;
  private readonly apiBaseUrl: string;

  constructor(
    config: GithubConfig,
    private readonly fetcher: Fetcher,
    private readonly logger: Logger,
    private readonly imageUploader?: GithubImageUploader,
  ) {
    this.headers = {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    };
    this.apiBaseUrl = `https://api.github.com/repos/${config.owner}/${config.repo}`;
  }

  async createIssue(issue: IssuableElement, labels: string[], milestoneNumber?: number, bodyOverride?: string): Promise<{ number: number; id: number; node_id: string }> {
    const formattedBody = AutoBodyMarkers.formatBodyForMarkdown(bodyOverride ?? issue.body ?? '');
    const wrappedBody = AutoBodyMarkers.wrapAutoBody(formattedBody);
    const payload: Record<string, unknown> = {
      title: issue.title,
      body: wrappedBody,
    };
    if (labels.length > 0) payload.labels = labels;
    if (milestoneNumber) payload.milestone = milestoneNumber;
    const res = await this.fetcher(`${this.apiBaseUrl}/issues`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async updateIssue(issueNumber: number, issue: IssuableElement, labels: string[], milestoneNumber?: number, bodyOverride?: string): Promise<void> {
    const existingBody = await this.fetchExistingIssueBody(issueNumber);
    const manualContent = AutoBodyMarkers.extractManualContent(existingBody);

    const formattedBody = AutoBodyMarkers.formatBodyForMarkdown(bodyOverride ?? issue.body ?? '');
    const wrappedBody = AutoBodyMarkers.wrapAutoBody(formattedBody) + manualContent;

    this.logger(`Update #${issueNumber} body: ${JSON.stringify(wrappedBody).substring(0, 200)}`);
    const payload: Record<string, unknown> = { title: issue.title, body: wrappedBody };
    if (labels.length > 0) payload.labels = labels;
    if (milestoneNumber) payload.milestone = milestoneNumber;
    const res = await this.fetcher(`${this.apiBaseUrl}/issues/${issueNumber}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) this.logger(`Update #${issueNumber} failed: ${res.status} ${await res.text()}`, 'error');
  }

  async ensureMilestones(milestoneNames: string[]): Promise<Record<string, number>> {
    const milestoneByName: Record<string, number> = {};
    if (milestoneNames.length === 0) return milestoneByName;

    const res = await this.fetcher(`${this.apiBaseUrl}/milestones?state=open&per_page=100`, {
      method: 'GET',
      headers: this.headers,
    });
    if (res.ok) {
      const existing: { number: number; title: string }[] = await res.json();
      for (const m of existing) {
        milestoneByName[m.title] = m.number;
      }
    }

    for (const name of milestoneNames) {
      if (milestoneByName[name]) continue;
      const createRes = await this.fetcher(`${this.apiBaseUrl}/milestones`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ title: name }),
      });
      if (createRes.ok) {
        const data: { number: number } = await createRes.json();
        milestoneByName[name] = data.number;
      } else {
        this.logger(`Erreur création milestone "${name}": ${createRes.status}`, 'error');
      }
    }

    return milestoneByName;
  }

  async ensureLabels(labelNames: string[]): Promise<void> {
    const existingNames = new Set<string>();
    const res = await this.fetcher(`${this.apiBaseUrl}/labels?per_page=100`, {
      method: 'GET',
      headers: this.headers,
    });
    if (res.ok) {
      const labels: { name: string }[] = await res.json();
      for (const label of labels) {
        existingNames.add(label.name);
      }
    }

    for (const name of labelNames) {
      if (existingNames.has(name)) continue;
      const createRes = await this.fetcher(`${this.apiBaseUrl}/labels`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ name, color: '6B7280' }),
      });
      if (!createRes.ok && createRes.status !== 422) {
        this.logger(`Erreur création label "${name}": ${createRes.status}`, 'error');
      }
    }
  }

  async linkSubIssues(
    issues: IssuableElement[],
    elementIdToNumber: Record<string, number>,
    elementIdToId: Record<string, number>,
  ): Promise<number> {
    let linked = 0;
    let subIssuesAvailable = true;

    for (const issue of issues) {
      if (!subIssuesAvailable) break;
      if (!issue.parentElementId) continue;
      const parentNumber = elementIdToNumber[issue.parentElementId];
      const childId = elementIdToId[issue.elementId];
      if (!parentNumber || !childId) continue;

      const res = await this.fetcher(`${this.apiBaseUrl}/issues/${parentNumber}/sub_issues`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ sub_issue_id: childId }),
      });
      if (res.ok) {
        linked++;
        this.logger(`Sub-issue #${elementIdToNumber[issue.elementId]} → #${parentNumber}`);
      } else if (res.status === 422) {
        // Already linked — skip silently
      } else if (res.status === 404) {
        subIssuesAvailable = false;
      } else {
        this.logger(`Erreur sub-issue #${elementIdToNumber[issue.elementId]} → #${parentNumber}: ${res.status}`, 'error');
      }
    }

    return linked;
  }

  async uploadAttachmentsAndEnrichBody(issue: IssuableElement): Promise<string> {
    if (!this.imageUploader || issue.attachments.length === 0) return issue.body;

    this.logger(`Upload de ${issue.attachments.length} wireframe(s) pour "${issue.title}"...`);

    const wireframeLines: string[] = [];
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedElementId = sanitize(issue.elementId);
    for (const attachment of issue.attachments) {
      const path = `.github/wireframes/${sanitizedElementId}/${sanitize(attachment.name)}.png`;
      try {
        const url = await this.imageUploader.uploadImage(path, attachment.bytes);
        this.logger(`Wireframe uploadé: ${attachment.name} → ${url}`);
        wireframeLines.push(`![${attachment.name}](${url})`);
      } catch (error) {
        this.logger(`Erreur upload wireframe "${attachment.name}": ${error instanceof Error ? error.message : String(error)}`, 'error');
      }
    }

    if (wireframeLines.length === 0) return issue.body;

    const parts: string[] = [];
    if (issue.body) parts.push(issue.body);
    parts.push('## Wireframes');
    parts.push(...wireframeLines);
    return parts.join('\n');
  }

  async deleteIssue(issueNodeId: string): Promise<void> {
    const res = await this.fetcher('https://api.github.com/graphql', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        query: 'mutation($issueId: ID!) { deleteIssue(input: { issueId: $issueId }) { repository { name } } }',
        variables: { issueId: issueNodeId },
      }),
    });
    const json = await res.json();
    if (json.errors) this.logger(`Delete issue failed: ${json.errors[0].message}`, 'error');
  }

  private async fetchExistingIssueBody(issueNumber: number): Promise<string> {
    const res = await this.fetcher(`${this.apiBaseUrl}/issues/${issueNumber}`, {
      method: 'GET',
      headers: this.headers,
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.body ?? '';
  }
}
