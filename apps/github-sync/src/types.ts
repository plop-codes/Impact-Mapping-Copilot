export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
export type Logger = (text: string, level?: 'info' | 'error' | 'success') => void;

export type GithubConfig = {
  token: string;
  owner: string;
  repo: string;
};
