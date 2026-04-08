import type { GithubImageUploader } from './githubImageUploader';
import type { Fetcher, GithubConfig } from './createGitHubIssues.fetchGithubIssueCreator';

export class FetchGithubImageUploader implements GithubImageUploader {
  private readonly headers: Record<string, string>;
  private readonly apiBaseUrl: string;

  constructor(
    private readonly config: GithubConfig,
    private readonly fetcher: Fetcher,
  ) {
    this.headers = {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    };
    this.apiBaseUrl = `https://api.github.com/repos/${config.owner}/${config.repo}`;
  }

  async uploadImage(path: string, content: Uint8Array): Promise<string> {
    const base64Content = this.uint8ArrayToBase64(content);

    const sha = await this.getExistingFileSha(path);

    const payload: Record<string, string> = {
      message: `Add wireframe ${path}`,
      content: base64Content,
    };
    if (sha) payload.sha = sha;

    const url = `${this.apiBaseUrl}/contents/${path}`;
    const res = await this.fetcher(url, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Upload image failed: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    return data.content.download_url;
  }

  private async getExistingFileSha(path: string): Promise<string | undefined> {
    const res = await this.fetcher(`${this.apiBaseUrl}/contents/${path}`, {
      method: 'GET',
      headers: this.headers,
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    return data.sha;
  }

  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
