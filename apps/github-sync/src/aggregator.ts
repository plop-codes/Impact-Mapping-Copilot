import type { Issuable } from './issuable';

export type ImpactMappingContext = {
  objective: { figjamId: string; title: string };
  actor: { figjamId: string; title: string };
  impact: { figjamId: string; title: string };
  action: { figjamId: string; title: string };
  userStory: {
    figjamId: string;
    title: string;
    body?: string;
    boundedContext?: string;
    domain?: string;
    milestone?: string;
  };
  scenarios: Array<{
    figjamId: string;
    title: string;
    body: string;
    testDrivers: Array<'backend-use-case' | 'backend-e2e' | 'ui'>;
  }>;
};

const TEST_DRIVER_LABEL: Record<string, string> = {
  'backend-use-case': 'test:backend-use-case',
  'backend-e2e': 'test:backend-e2e',
  ui: 'test:ui',
};

export function aggregate(ctx: ImpactMappingContext): Issuable[] {
  const parentBody = [
    '## Objectif',
    ctx.objective.title,
    '',
    '## Acteur',
    ctx.actor.title,
    '',
    '## Impact',
    ctx.impact.title,
    '',
    '## Action',
    ctx.action.title,
  ].join('\n');

  const userStoryBody = buildUserStoryBody(ctx);

  const issuables: Issuable[] = [];

  issuables.push({
    figjamId: ctx.action.figjamId,
    kind: 'parent',
    title: ctx.action.title,
    body: parentBody,
    labels: [],
    milestone: ctx.userStory.milestone,
  });

  issuables.push({
    figjamId: ctx.userStory.figjamId,
    parentFigjamId: ctx.action.figjamId,
    kind: 'user-story',
    title: ctx.userStory.title,
    body: userStoryBody,
    labels: [],
    milestone: ctx.userStory.milestone,
  });

  for (const scenario of ctx.scenarios) {
    issuables.push({
      figjamId: scenario.figjamId,
      parentFigjamId: ctx.userStory.figjamId,
      kind: 'scenario',
      title: scenario.title,
      body: scenario.body,
      labels: scenario.testDrivers.map((d) => TEST_DRIVER_LABEL[d]).filter((l): l is string => Boolean(l)),
      milestone: ctx.userStory.milestone,
    });
  }

  return issuables;
}

function buildUserStoryBody(ctx: ImpactMappingContext): string {
  const parts: string[] = [];
  if (ctx.userStory.body) parts.push(ctx.userStory.body);
  if (ctx.userStory.boundedContext) {
    parts.push('## Bounded Context');
    parts.push(ctx.userStory.boundedContext);
  }
  if (ctx.userStory.domain) {
    parts.push('## Domain');
    parts.push(ctx.userStory.domain);
  }
  return parts.join('\n');
}
