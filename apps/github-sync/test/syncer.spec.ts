import { describe, expect, it } from 'vitest';
import { aggregate, type ImpactMappingContext } from '../src/aggregator';
import { GithubClient } from '../src/githubClient';
import { Syncer } from '../src/syncer';
import { figjamIdMarker, wrapAutoBody } from '../src/bodyMarkers';
import { InMemoryGithub } from './inMemoryGithub';

const SILENT_LOGGER = (): void => undefined;

function makeContext(): ImpactMappingContext {
  return {
    objective: { figjamId: 'obj-1', title: 'Augmenter le CA' },
    actor: { figjamId: 'act-1', title: 'ADV' },
    impact: { figjamId: 'imp-1', title: 'Saisir plus vite' },
    action: { figjamId: 'action-1', title: 'Saisir une commande' },
    userStory: {
      figjamId: 'us-1',
      title: 'Saisir une commande standard',
      milestone: 'v1',
    },
    scenarios: [
      {
        figjamId: 'sc-1',
        title: 'Saisie nominale',
        body: 'GWT...',
        testDrivers: ['backend-use-case', 'backend-e2e', 'ui'],
      },
    ],
  };
}

describe('Syncer', () => {
  it('cree la hierarchie complete sur un repo vide', async () => {
    const github = new InMemoryGithub();
    const client = new GithubClient(
      { token: 't', owner: 'o', repo: 'r' },
      github.fetcher,
      SILENT_LOGGER,
    );
    const syncer = new Syncer(client, 'o/r', SILENT_LOGGER);

    const summary = await syncer.sync(aggregate(makeContext()));

    expect(summary.errors).toEqual([]);
    expect(summary.created).toHaveLength(3);
    expect(summary.updated).toHaveLength(0);
    expect(summary.subIssuesLinked).toBe(2);
    expect(github.issues).toHaveLength(3);
    for (const issue of github.issues) {
      expect(issue.body).toContain('<!-- figjam-id:');
    }
  });

  it('est idempotent : un second run met a jour au lieu de creer', async () => {
    const github = new InMemoryGithub();
    const client = new GithubClient(
      { token: 't', owner: 'o', repo: 'r' },
      github.fetcher,
      SILENT_LOGGER,
    );
    const syncer = new Syncer(client, 'o/r', SILENT_LOGGER);
    const issuables = aggregate(makeContext());

    await syncer.sync(issuables);
    const second = await syncer.sync(issuables);

    expect(second.created).toHaveLength(0);
    expect(second.updated).toHaveLength(3);
    expect(github.issues).toHaveLength(3);
  });

  it('preserve le contenu manuel ajoute apres le marqueur de fin lors d un update', async () => {
    const github = new InMemoryGithub();
    github.seedIssue({
      title: 'Saisir une commande',
      body:
        wrapAutoBody('action-1', 'ancien contenu auto') +
        '\n\n## Notes\nremarques manuelles importantes',
      labels: [],
      milestone: null,
    });

    const client = new GithubClient(
      { token: 't', owner: 'o', repo: 'r' },
      github.fetcher,
      SILENT_LOGGER,
    );
    const syncer = new Syncer(client, 'o/r', SILENT_LOGGER);

    await syncer.sync(aggregate(makeContext()));

    const parent = github.issues.find((i) => i.body.includes(figjamIdMarker('action-1')));
    expect(parent).toBeDefined();
    expect(parent?.body).toContain('remarques manuelles importantes');
  });

  it('cree les labels test:* manquants avant de creer les issues', async () => {
    const github = new InMemoryGithub();
    const client = new GithubClient(
      { token: 't', owner: 'o', repo: 'r' },
      github.fetcher,
      SILENT_LOGGER,
    );
    const syncer = new Syncer(client, 'o/r', SILENT_LOGGER);

    await syncer.sync(aggregate(makeContext()));

    expect(github.labels.has('test:backend-use-case')).toBe(true);
    expect(github.labels.has('test:backend-e2e')).toBe(true);
    expect(github.labels.has('test:ui')).toBe(true);
  });

  it('cree les milestones manquants', async () => {
    const github = new InMemoryGithub();
    const client = new GithubClient(
      { token: 't', owner: 'o', repo: 'r' },
      github.fetcher,
      SILENT_LOGGER,
    );
    const syncer = new Syncer(client, 'o/r', SILENT_LOGGER);

    await syncer.sync(aggregate(makeContext()));

    expect(github.milestones.has('v1')).toBe(true);
  });

  it('marque les sub-issues comme unsupported si l API repond 404 et continue sans bloquer', async () => {
    const github = new InMemoryGithub();
    github.subIssuesSupported = false;
    const client = new GithubClient(
      { token: 't', owner: 'o', repo: 'r' },
      github.fetcher,
      SILENT_LOGGER,
    );
    const syncer = new Syncer(client, 'o/r', SILENT_LOGGER);

    const summary = await syncer.sync(aggregate(makeContext()));

    expect(summary.subIssuesUnsupported).toBe(true);
    expect(summary.subIssuesLinked).toBe(0);
    expect(summary.created).toHaveLength(3);
  });
});
