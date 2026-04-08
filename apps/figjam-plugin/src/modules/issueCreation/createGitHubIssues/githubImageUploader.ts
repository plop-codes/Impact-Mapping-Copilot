export type ImageAttachment = { name: string; bytes: Uint8Array };

export interface GithubImageUploader {
  uploadImage(path: string, content: Uint8Array): Promise<string>;
}
