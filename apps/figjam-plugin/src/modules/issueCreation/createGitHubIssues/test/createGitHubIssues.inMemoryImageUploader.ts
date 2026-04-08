import type { GithubImageUploader } from '../githubImageUploader';

export type UploadedImage = {
  path: string;
  content: Uint8Array;
  url: string;
};

export class CreateGitHubIssuesInMemoryImageUploader implements GithubImageUploader {
  readonly uploadedImages: UploadedImage[] = [];

  async uploadImage(path: string, content: Uint8Array): Promise<string> {
    const url = `https://raw.githubusercontent.com/test-owner/test-repo/main/${path}`;
    this.uploadedImages.push({ path, content, url });
    return url;
  }
}
