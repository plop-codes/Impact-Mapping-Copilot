import type { IssuableElement } from '../../issuableElement';
import type { GithubIssueCreator } from '../githubIssueCreator';

export class CreateGitHubIssuesInMemoryIssueCreator
  implements GithubIssueCreator
{
  private readonly issuesByElementId = new Map<string, IssuableElement>();
  readonly callHistory: { created: IssuableElement[]; updated: IssuableElement[]; deleted: IssuableElement[] }[] = [];

  get createdIssues(): IssuableElement[] {
    return [...this.issuesByElementId.values()];
  }

  get deletedElementIds(): string[] {
    return this.callHistory.flatMap((h) => h.deleted.map((i) => i.elementId));
  }

  async createIssues(issues: IssuableElement[], deleteOrphans?: boolean): Promise<void> {
    const created: IssuableElement[] = [];
    const updated: IssuableElement[] = [];
    const deleted: IssuableElement[] = [];

    for (const issue of issues) {
      if (this.issuesByElementId.has(issue.elementId)) {
        updated.push(issue);
      } else {
        created.push(issue);
      }
      this.issuesByElementId.set(issue.elementId, issue);
    }

    if (deleteOrphans) {
      const syncedElementIds = new Set(issues.map((i) => i.elementId));

      for (const [elementId, existing] of this.issuesByElementId) {
        if (!syncedElementIds.has(elementId)) {
          deleted.push(existing);
          this.issuesByElementId.delete(elementId);
        }
      }
    }

    this.callHistory.push({ created, updated, deleted });
  }
}
