import type { Fetcher } from './githubTypes';

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
    `URL utilisée : ${url}`,
    `Causes possibles : owner ou repo invalide (URL malformée), problème réseau, ou requête bloquée par CORS.`,
    `Détail : ${detail}`,
  ].join('\n');
}

export function formatHttpError(status: number, url: string, body: string): string {
  switch (status) {
    case 401:
      return [
        `Token GitHub invalide ou expiré (401).`,
        `URL : ${url}`,
        `Vérifie le token dans le formulaire.`,
      ].join('\n');
    case 403:
      return [
        `Le token GitHub n'a pas les droits nécessaires pour cette opération (403).`,
        `URL : ${url}`,
        `Vérifie les scopes du token (repo, project, et write:org si c'est une organisation).`,
        `Détail : ${truncate(body)}`,
      ].join('\n');
    case 404:
      return [
        `Ressource GitHub introuvable (404).`,
        `URL : ${url}`,
        `Vérifie l'owner et le repo dans le formulaire (sans "https://", sans slash final).`,
      ].join('\n');
    case 422:
      return [
        `Requête GitHub invalide (422).`,
        `URL : ${url}`,
        `Détail : ${truncate(body)}`,
      ].join('\n');
    case 429:
      return [
        `Limite de requêtes GitHub atteinte (429).`,
        `URL : ${url}`,
        `Réessaie dans quelques minutes.`,
      ].join('\n');
    default:
      return [
        `Erreur GitHub ${status}.`,
        `URL : ${url}`,
        `Détail : ${truncate(body)}`,
      ].join('\n');
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
