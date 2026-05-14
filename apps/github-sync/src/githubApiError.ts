import type { Fetcher } from './types';

export class GithubApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GithubApiError';
    this.status = status;
  }
}

export async function githubFetch(
  fetcher: Fetcher,
  url: string,
  init: RequestInit,
): Promise<Response> {
  let res: Response;
  try {
    res = await fetcher(url, init);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new GithubApiError(formatNetworkError(url, detail));
  }
  if (!res.ok) {
    const body = await safeReadText(res);
    throw new GithubApiError(formatHttpError(res.status, url, body), res.status);
  }
  return res;
}

export function formatNetworkError(url: string, detail: string): string {
  return [
    `Impossible de joindre GitHub.`,
    `URL utilisee : ${url}`,
    `Causes possibles : owner ou repo invalide, probleme reseau, ou requete bloquee par CORS.`,
    `Detail : ${detail}`,
  ].join('\n');
}

export function formatHttpError(status: number, url: string, body: string): string {
  switch (status) {
    case 401:
      return `Token GitHub invalide ou expire (401). URL : ${url}`;
    case 403:
      return `Le token GitHub n'a pas les droits necessaires (403). URL : ${url}. Detail : ${truncate(body)}`;
    case 404:
      return `Ressource GitHub introuvable (404). URL : ${url}`;
    case 422:
      return `Requete GitHub invalide (422). URL : ${url}. Detail : ${truncate(body)}`;
    case 429:
      return `Limite de requetes GitHub atteinte (429). URL : ${url}`;
    default:
      return `Erreur GitHub ${status}. URL : ${url}. Detail : ${truncate(body)}`;
  }
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

function truncate(text: string): string {
  if (text.length <= 300) return text;
  return text.substring(0, 300) + '...';
}
