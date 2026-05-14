import type { Fetcher } from '../src/types';

export type InMemoryIssue = {
  number: number;
  id: number;
  node_id: string;
  title: string;
  body: string;
  labels: string[];
  milestone: number | null;
};

export type InMemorySubIssueLink = {
  parentNumber: number;
  childRestId: number;
};

export class InMemoryGithub {
  issues: InMemoryIssue[] = [];
  labels = new Set<string>();
  milestones = new Map<string, number>();
  subIssueLinks: InMemorySubIssueLink[] = [];
  subIssuesSupported = true;
  private nextIssueNumber = 1;
  private nextIssueRestId = 1000;
  private nextMilestoneNumber = 1;

  seedIssue(issue: Omit<InMemoryIssue, 'number' | 'id' | 'node_id'>): InMemoryIssue {
    const created: InMemoryIssue = {
      ...issue,
      number: this.nextIssueNumber++,
      id: this.nextIssueRestId++,
      node_id: `node_${this.nextIssueRestId}`,
    };
    this.issues.push(created);
    return created;
  }

  fetcher: Fetcher = async (url, init) => {
    const method = (init.method ?? 'GET').toUpperCase();
    const u = new URL(url);
    const path = u.pathname;

    if (path.endsWith('/labels') && method === 'GET') {
      return ok(Array.from(this.labels).map((name) => ({ name })));
    }
    if (path.endsWith('/labels') && method === 'POST') {
      const body = parseBody(init.body);
      if (this.labels.has(body.name)) return fail(422, 'already_exists');
      this.labels.add(body.name);
      return ok({ name: body.name });
    }

    if (path.endsWith('/milestones') && method === 'GET') {
      const list = Array.from(this.milestones.entries()).map(([title, number]) => ({ title, number }));
      return ok(list);
    }
    if (path.endsWith('/milestones') && method === 'POST') {
      const body = parseBody(init.body);
      const number = this.nextMilestoneNumber++;
      this.milestones.set(body.title, number);
      return ok({ number });
    }

    if (path.endsWith('/issues') && method === 'GET') {
      return ok(
        this.issues.map((i) => ({
          number: i.number,
          id: i.id,
          node_id: i.node_id,
          body: i.body,
        })),
      );
    }
    if (path.endsWith('/issues') && method === 'POST') {
      const body = parseBody(init.body);
      const created = this.seedIssue({
        title: body.title,
        body: body.body,
        labels: body.labels ?? [],
        milestone: body.milestone ?? null,
      });
      return ok({ number: created.number, id: created.id, node_id: created.node_id });
    }

    const issueMatch = path.match(/\/issues\/(\d+)$/);
    if (issueMatch && method === 'PATCH') {
      const number = Number(issueMatch[1]);
      const target = this.issues.find((i) => i.number === number);
      if (!target) return fail(404, 'not found');
      const body = parseBody(init.body);
      if (body.title !== undefined) target.title = body.title;
      if (body.body !== undefined) target.body = body.body;
      if (body.labels !== undefined) target.labels = body.labels;
      if (body.milestone !== undefined) target.milestone = body.milestone;
      return ok({});
    }

    const subIssueMatch = path.match(/\/issues\/(\d+)\/sub_issues$/);
    if (subIssueMatch && method === 'POST') {
      if (!this.subIssuesSupported) return fail(404, 'sub-issues unsupported');
      const parentNumber = Number(subIssueMatch[1]);
      const body = parseBody(init.body);
      const alreadyLinked = this.subIssueLinks.some(
        (l) => l.parentNumber === parentNumber && l.childRestId === body.sub_issue_id,
      );
      if (alreadyLinked) return fail(422, 'already linked');
      this.subIssueLinks.push({ parentNumber, childRestId: body.sub_issue_id });
      return ok({});
    }

    return fail(404, `unknown route ${method} ${path}`);
  };
}

function parseBody(body: BodyInit | null | undefined): any {
  if (!body) return {};
  if (typeof body === 'string') return JSON.parse(body);
  throw new Error('Unexpected body type in test fetcher');
}

function ok(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function fail(status: number, message: string): Response {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
