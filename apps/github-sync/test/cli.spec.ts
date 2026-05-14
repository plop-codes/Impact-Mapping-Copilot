import { describe, expect, it, vi } from 'vitest';
import { runCli } from '../src/cli';
import { InMemoryGithub } from './inMemoryGithub';

describe('CLI runCli', () => {
  it('retourne exitCode 2 si JSON invalide', async () => {
    const { exitCode, output } = await runCli('not json');
    expect(exitCode).toBe(2);
    expect(JSON.parse(output).error).toContain('Invalid JSON');
  });

  it('retourne exitCode 2 si github config incomplete', async () => {
    const { exitCode } = await runCli(
      JSON.stringify({ github: { token: 't' }, payload: { kind: 'issuables', issuables: [] } }),
    );
    expect(exitCode).toBe(2);
  });

  it('retourne exitCode 2 si payload.kind inconnu', async () => {
    const { exitCode } = await runCli(
      JSON.stringify({ github: { token: 't', owner: 'o', repo: 'r' }, payload: { kind: 'wat' } }),
    );
    expect(exitCode).toBe(2);
  });

  it('appelle bien le fetch global avec aggregated-context et retourne un resume JSON', async () => {
    const github = new InMemoryGithub();
    vi.stubGlobal('fetch', github.fetcher);

    const input = {
      github: { token: 't', owner: 'o', repo: 'r' },
      payload: {
        kind: 'aggregated-context',
        context: {
          objective: { figjamId: 'obj', title: 'O' },
          actor: { figjamId: 'act', title: 'A' },
          impact: { figjamId: 'imp', title: 'I' },
          action: { figjamId: 'action', title: 'Act' },
          userStory: { figjamId: 'us', title: 'US' },
          scenarios: [{ figjamId: 'sc', title: 'S', body: 'b', testDrivers: ['ui'] }],
        },
      },
    };

    const { exitCode, output } = await runCli(JSON.stringify(input));
    expect(exitCode).toBe(0);
    const summary = JSON.parse(output);
    expect(summary.created).toHaveLength(3);
    expect(summary.errors).toEqual([]);

    vi.unstubAllGlobals();
  });
});
