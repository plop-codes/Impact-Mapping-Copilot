import type { HierarchizedElementJson } from '../../boardAnalysis/impactMapping';
import { IssuableElements } from '../issuableElements';
import type { GithubIssueCreator } from './githubIssueCreator';
import type { ImageAttachment } from './githubImageUploader';
import { CommandResult } from '../../shared/result/commandResult';

export class CreateGitHubIssuesUseCase {
  constructor(
    private readonly githubIssueCreator: GithubIssueCreator,
  ) {}

  async execute(
    hierarchizedElements: HierarchizedElementJson[],
    attachmentsByElementId?: Record<string, ImageAttachment[]>,
    selectedElementIds?: string[],
  ): Promise<CommandResult<string>> {
    try {
      const isFullSync = !selectedElementIds;
      const issuableElements = selectedElementIds
        ? IssuableElements.fromSelectedElements(selectedElementIds, hierarchizedElements, attachmentsByElementId)
        : IssuableElements.fromHierarchizedElements(hierarchizedElements, attachmentsByElementId);
      await this.githubIssueCreator.createIssues(issuableElements.items, isFullSync);
      return CommandResult.success();
    } catch (error) {
      return CommandResult.failure(
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
