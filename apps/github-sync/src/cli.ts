import { aggregate, type ImpactMappingContext } from './aggregator';
import { GithubClient } from './githubClient';
import type { Issuable } from './issuable';
import { Syncer } from './syncer';
import type { GithubConfig } from './types';

type CliInput = {
  github: GithubConfig;
  payload:
    | { kind: 'aggregated-context'; context: ImpactMappingContext }
    | { kind: 'issuables'; issuables: Issuable[] };
};

export async function runCli(stdinJson: string): Promise<{ exitCode: 0 | 1 | 2; output: string }> {
  let parsed: CliInput;
  try {
    parsed = JSON.parse(stdinJson) as CliInput;
  } catch (error) {
    return {
      exitCode: 2,
      output: JSON.stringify({ error: `Invalid JSON on stdin: ${describe(error)}` }, null, 2),
    };
  }

  const { github, payload } = parsed;
  if (!github?.token || !github?.owner || !github?.repo) {
    return {
      exitCode: 2,
      output: JSON.stringify(
        { error: 'github.token, github.owner et github.repo sont requis.' },
        null,
        2,
      ),
    };
  }

  let issuables: Issuable[];
  if (payload?.kind === 'aggregated-context') {
    issuables = aggregate(payload.context);
  } else if (payload?.kind === 'issuables') {
    issuables = payload.issuables;
  } else {
    return {
      exitCode: 2,
      output: JSON.stringify(
        { error: 'payload.kind doit etre "aggregated-context" ou "issuables".' },
        null,
        2,
      ),
    };
  }

  const logger = (text: string, level?: 'info' | 'error' | 'success'): void => {
    const prefix = level === 'error' ? '[error]' : level === 'success' ? '[ok]' : '[info]';
    process.stderr.write(`${prefix} ${text}\n`);
  };

  const client = new GithubClient(github, fetch, logger);
  const syncer = new Syncer(client, `${github.owner}/${github.repo}`, logger);

  try {
    const summary = await syncer.sync(issuables);
    const exitCode = summary.errors.length > 0 ? 1 : 0;
    return { exitCode, output: JSON.stringify(summary, null, 2) };
  } catch (error) {
    return {
      exitCode: 2,
      output: JSON.stringify({ error: describe(error) }, null, 2),
    };
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}
