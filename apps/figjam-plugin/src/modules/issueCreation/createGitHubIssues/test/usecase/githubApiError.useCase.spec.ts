import { describe, test, expect } from 'vitest';
import {
  GithubApiError,
  githubFetch,
  formatHttpError,
  formatNetworkError,
} from '../../createGitHubIssues.githubApiError';

const URL_LABELS = 'https://api.github.com/repos/plop-codes/discac-yoda/labels?per_page=100';

function fakeResponse(status: number, body: string): Response {
  return new Response(body, { status });
}

describe('GithubApiError formatter', () => {
  test('404 mentions repo introuvable and the URL', () => {
    const message = formatHttpError(404, URL_LABELS, 'Not Found');
    expect(message).toContain('404');
    expect(message).toContain('introuvable');
    expect(message).toContain(URL_LABELS);
    expect(message).toContain("owner");
    expect(message).toContain('repo');
  });

  test('401 mentions token invalide and the URL', () => {
    const message = formatHttpError(401, URL_LABELS, 'Bad credentials');
    expect(message).toContain('401');
    expect(message).toContain('Token');
    expect(message).toContain(URL_LABELS);
  });

  test('403 mentions droits/scopes and the URL', () => {
    const message = formatHttpError(403, URL_LABELS, 'Forbidden');
    expect(message).toContain('403');
    expect(message).toContain('droits');
    expect(message).toContain('scopes');
    expect(message).toContain(URL_LABELS);
  });

  test('422 mentions invalide and the URL', () => {
    const message = formatHttpError(422, URL_LABELS, 'Validation failed');
    expect(message).toContain('422');
    expect(message).toContain('invalide');
    expect(message).toContain(URL_LABELS);
  });

  test('429 mentions limite de requêtes and the URL', () => {
    const message = formatHttpError(429, URL_LABELS, '');
    expect(message).toContain('429');
    expect(message).toContain('Limite');
    expect(message).toContain(URL_LABELS);
  });

  test('default formats unknown status with URL and detail', () => {
    const message = formatHttpError(500, URL_LABELS, 'oops');
    expect(message).toContain('500');
    expect(message).toContain(URL_LABELS);
    expect(message).toContain('oops');
  });

  test('truncates very long response bodies', () => {
    const longBody = 'x'.repeat(500);
    const message = formatHttpError(422, URL_LABELS, longBody);
    expect(message.length).toBeLessThan(longBody.length + 200);
    expect(message).toContain('...');
  });

  test('network error message contains URL and CORS hint', () => {
    const message = formatNetworkError(URL_LABELS, 'Failed to fetch');
    expect(message).toContain(URL_LABELS);
    expect(message).toContain('CORS');
    expect(message).toContain('Failed to fetch');
  });
});

describe('githubFetch', () => {
  test('throws GithubApiError with status when response is not ok', async () => {
    const fetcher = async () => fakeResponse(404, 'Not Found');
    await expect(githubFetch(fetcher, URL_LABELS, { method: 'GET' })).rejects.toMatchObject({
      name: 'GithubApiError',
      status: 404,
    });
  });

  test('throws GithubApiError without status when fetcher rejects (network failure)', async () => {
    const fetcher = async () => {
      throw new TypeError('Failed to fetch');
    };
    try {
      await githubFetch(fetcher, URL_LABELS, { method: 'GET' });
      expect.fail('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(GithubApiError);
      expect((error as GithubApiError).status).toBeUndefined();
      expect((error as Error).message).toContain(URL_LABELS);
      expect((error as Error).message).toContain('Failed to fetch');
    }
  });

  test('returns the response when ok', async () => {
    const fetcher = async () => fakeResponse(200, '{"ok":true}');
    const res = await githubFetch(fetcher, URL_LABELS, { method: 'GET' });
    expect(res.ok).toBe(true);
  });
});
