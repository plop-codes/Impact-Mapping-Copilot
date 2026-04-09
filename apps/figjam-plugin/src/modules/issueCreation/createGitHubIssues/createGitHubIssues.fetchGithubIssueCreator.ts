import { ElementType } from '../../boardAnalysis/element';
import type { IssuableElement } from '../issuableElement';
import type { GithubIssueCreator } from './githubIssueCreator';
import type { GithubImageUploader } from './githubImageUploader';
import { GithubProjectClient } from './createGitHubIssues.githubProjectClient';
import { GithubIssueClient } from './createGitHubIssues.githubIssueClient';
import { AutoBodyMarkers } from './autoBodyMarkers';
import type { GithubConfig, Fetcher, Logger } from './githubTypes';
import type { GlossaryEntry } from '../../boardAnalysis/analyzeContextElements/contextElements';
export type { Fetcher, Logger, GithubConfig } from './githubTypes';

const ELEMENT_TYPE_NAMES: Record<string, string> = {
  [ElementType.OBJECTIVE]: 'Objective',
  [ElementType.ACTOR]: 'Actor',
  [ElementType.IMPACT]: 'Impact',
  [ElementType.ACTION]: 'Action',
  [ElementType.USER_STORY]: 'User Story',
  [ElementType.SCENARIO]: 'Scenario',
};

export class FetchGithubIssueCreator implements GithubIssueCreator {
  private readonly projectClient: GithubProjectClient;
  private readonly issueClient: GithubIssueClient;

  constructor(
    config: GithubConfig,
    fetcher: Fetcher,
    private readonly logger: Logger,
    imageUploader?: GithubImageUploader,
  ) {
    this.projectClient = new GithubProjectClient(config, fetcher, logger);
    this.issueClient = new GithubIssueClient(config, fetcher, logger, imageUploader);
  }

  static wrapAutoBody(body: string): string {
    return AutoBodyMarkers.wrapAutoBody(body);
  }

  static extractManualContent(existingBody: string): string {
    return AutoBodyMarkers.extractManualContent(existingBody);
  }

  async updateProjectReadme(productVision?: string[], operationalActors?: string[], glossary?: GlossaryEntry[]): Promise<void> {
    await this.projectClient.updateProjectReadme(productVision, operationalActors, glossary);
  }

  async createIssues(issues: IssuableElement[], deleteOrphans?: boolean): Promise<void> {
    const isOrg = await this.projectClient.detectIsOrg();
    const elementTypes = [...new Set(issues.map((i) => ELEMENT_TYPE_NAMES[i.type]))];

    this.logger('Récupération du projet...');
    const projectId = await this.projectClient.getProjectId(isOrg);
    const elementIdFieldId = await this.projectClient.ensureTextField(projectId, 'figjam_element_id');
    const elementTypeField = await this.projectClient.ensureSingleSelectField(projectId, 'Element type', elementTypes);
    const existingItems = await this.projectClient.getExistingItems(projectId);
    this.logger(`Projet trouvé, ${Object.keys(existingItems).length} issues existantes.`);

    const allTestDrivers = [...new Set(issues.flatMap((i) => i.testDrivers))];
    if (allTestDrivers.length > 0) {
      await this.issueClient.ensureLabels(allTestDrivers.map((d) => `test:${d}`));
    }

    const milestoneNames = [...new Set(issues.map((i) => i.milestone).filter((m): m is string => !!m))];
    const milestoneByName = await this.issueClient.ensureMilestones(milestoneNames);

    const optionByName: Record<string, string> = {};
    for (const opt of elementTypeField.options) {
      optionByName[opt.name] = opt.id;
    }

    const elementIdToNumber: Record<string, number> = {};
    const elementIdToId: Record<string, number> = {};

    let created = 0;
    let updated = 0;

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const elementType = ELEMENT_TYPE_NAMES[issue.type];
      const existing = existingItems[issue.elementId];

      const testDriverLabels = issue.testDrivers.map((d) => `test:${d}`);
      const milestoneNumber = issue.milestone ? milestoneByName[issue.milestone] : undefined;

      const bodyWithWireframes = await this.issueClient.uploadAttachmentsAndEnrichBody(issue);

      if (existing) {
        await this.issueClient.updateIssue(existing.issueNumber, issue, testDriverLabels, milestoneNumber, bodyWithWireframes);
        elementIdToNumber[issue.elementId] = existing.issueNumber;
        elementIdToId[issue.elementId] = existing.issueRestId;

        updated++;
        this.logger(`Issue #${existing.issueNumber} mise à jour (${i + 1}/${issues.length})`);
      } else {
        const data = await this.issueClient.createIssue(issue, testDriverLabels, milestoneNumber, bodyWithWireframes);
        elementIdToNumber[issue.elementId] = data.number;
        elementIdToId[issue.elementId] = data.id;
        created++;
        this.logger(`Issue #${data.number} créée [${elementType}] (${i + 1}/${issues.length})`);

        const itemId = await this.projectClient.addItemToProject(projectId, data.node_id);
        await this.projectClient.setTextFieldValue(projectId, itemId, elementIdFieldId, issue.elementId);
        const optionId = optionByName[elementType];
        if (optionId) {
          await this.projectClient.setSingleSelectFieldValue(projectId, itemId, elementTypeField.id, optionId);
        }
      }
    }

    const linked = await this.issueClient.linkSubIssues(issues, elementIdToNumber, elementIdToId);

    const deleted = deleteOrphans
      ? await this.deleteOrphanIssues(projectId, issues, existingItems)
      : 0;

    this.logger(`Terminé: ${created} créées, ${updated} mises à jour, ${linked} sub-issues, ${deleted} supprimées.`, 'success');
  }

  private async deleteOrphanIssues(
    projectId: string,
    issues: IssuableElement[],
    existingItems: Record<string, { itemId: string; issueNodeId: string; issueNumber: number; issueRestId: number }>,
  ): Promise<number> {
    const syncedElementIds = new Set(issues.map((i) => i.elementId));

    let deleted = 0;

    for (const [elementId, item] of Object.entries(existingItems)) {
      if (syncedElementIds.has(elementId)) continue;

      await this.projectClient.deleteProjectItem(projectId, item.itemId);
      await this.issueClient.deleteIssue(item.issueNodeId);
      deleted++;
      this.logger(`Issue #${item.issueNumber} supprimée (élément supprimé du board)`);
    }

    return deleted;
  }
}
