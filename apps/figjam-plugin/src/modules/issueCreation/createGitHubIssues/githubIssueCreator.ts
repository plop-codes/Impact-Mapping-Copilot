import type { IssuableElement } from '../issuableElement';

export interface GithubIssueCreator {
  createIssues(issues: IssuableElement[], deleteOrphans?: boolean): Promise<void>;
}
