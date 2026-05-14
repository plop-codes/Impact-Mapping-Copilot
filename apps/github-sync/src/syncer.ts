import type { Issuable } from './issuable';
import type { Logger } from './types';
import { GithubClient, type ExistingIssue, type IssueRef } from './githubClient';

export type SyncSummary = {
  created: Array<{ figjamId: string; number: number; url: string }>;
  updated: Array<{ figjamId: string; number: number; url: string }>;
  subIssuesLinked: number;
  subIssuesAlreadyLinked: number;
  subIssuesUnsupported: boolean;
  subIssuesErrors: number;
  errors: string[];
};

export class Syncer {
  constructor(
    private readonly client: GithubClient,
    private readonly repoFullName: string,
    private readonly logger: Logger,
  ) {}

  async sync(issuables: Issuable[]): Promise<SyncSummary> {
    const summary: SyncSummary = {
      created: [],
      updated: [],
      subIssuesLinked: 0,
      subIssuesAlreadyLinked: 0,
      subIssuesUnsupported: false,
      subIssuesErrors: 0,
      errors: [],
    };

    const labels = unique(issuables.flatMap((i) => i.labels));
    if (labels.length > 0) {
      try {
        await this.client.ensureLabels(labels);
      } catch (error) {
        summary.errors.push(`ensureLabels: ${describe(error)}`);
      }
    }

    const milestones = unique(
      issuables.map((i) => i.milestone).filter((m): m is string => Boolean(m)),
    );
    let milestoneByName: Record<string, number> = {};
    try {
      milestoneByName = await this.client.ensureMilestones(milestones);
    } catch (error) {
      summary.errors.push(`ensureMilestones: ${describe(error)}`);
    }

    let existingByFigjamId: Map<string, ExistingIssue>;
    try {
      existingByFigjamId = await this.client.listExistingIssuesByFigjamId();
    } catch (error) {
      summary.errors.push(`listExistingIssues: ${describe(error)}`);
      return summary;
    }

    const refsByFigjamId = new Map<string, IssueRef>();

    const sorted = topologicallySort(issuables);

    for (const issuable of sorted) {
      const milestoneNumber = issuable.milestone ? milestoneByName[issuable.milestone] : undefined;
      const existing = existingByFigjamId.get(issuable.figjamId);

      if (existing) {
        try {
          await this.client.updateIssue(existing, issuable, milestoneNumber);
          summary.updated.push({
            figjamId: issuable.figjamId,
            number: existing.number,
            url: this.issueUrl(existing.number),
          });
          refsByFigjamId.set(issuable.figjamId, {
            number: existing.number,
            restId: existing.restId,
            nodeId: existing.nodeId,
          });
        } catch (error) {
          summary.errors.push(`update ${issuable.figjamId}: ${describe(error)}`);
        }
      } else {
        try {
          const ref = await this.client.createIssue(issuable, milestoneNumber);
          summary.created.push({
            figjamId: issuable.figjamId,
            number: ref.number,
            url: this.issueUrl(ref.number),
          });
          refsByFigjamId.set(issuable.figjamId, ref);
        } catch (error) {
          summary.errors.push(`create ${issuable.figjamId}: ${describe(error)}`);
        }
      }
    }

    for (const issuable of sorted) {
      if (!issuable.parentFigjamId) continue;
      const parent = refsByFigjamId.get(issuable.parentFigjamId);
      const child = refsByFigjamId.get(issuable.figjamId);
      if (!parent || !child) continue;
      if (summary.subIssuesUnsupported) break;

      const result = await this.client.linkSubIssue(parent.number, child.restId);
      if (result === 'linked') summary.subIssuesLinked++;
      else if (result === 'already') summary.subIssuesAlreadyLinked++;
      else if (result === 'unsupported') {
        summary.subIssuesUnsupported = true;
        this.logger('Sub-issues non supportes par ce repo (404), liens ignores.', 'info');
      } else if (result === 'error') summary.subIssuesErrors++;
    }

    return summary;
  }

  private issueUrl(number: number): string {
    return `https://github.com/${this.repoFullName}/issues/${number}`;
  }
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function topologicallySort(issuables: Issuable[]): Issuable[] {
  const byId = new Map<string, Issuable>();
  for (const i of issuables) byId.set(i.figjamId, i);

  const visited = new Set<string>();
  const out: Issuable[] = [];

  const visit = (i: Issuable): void => {
    if (visited.has(i.figjamId)) return;
    visited.add(i.figjamId);
    if (i.parentFigjamId) {
      const parent = byId.get(i.parentFigjamId);
      if (parent) visit(parent);
    }
    out.push(i);
  };

  for (const i of issuables) visit(i);
  return out;
}
