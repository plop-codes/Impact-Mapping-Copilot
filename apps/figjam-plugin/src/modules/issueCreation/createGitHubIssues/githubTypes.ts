export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
export type Logger = (text: string, className?: string) => void;

export type GithubConfig = {
  token: string;
  owner: string;
  repo: string;
  projectNumber: number;
};
