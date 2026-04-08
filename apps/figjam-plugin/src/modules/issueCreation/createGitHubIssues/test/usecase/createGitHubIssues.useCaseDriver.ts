import { expect } from 'vitest';
import { ElementType } from '../../../../boardAnalysis/element';
import type { HierarchizedElementJson } from '../../../../boardAnalysis/impactMapping';
import { CreateGitHubIssuesUseCase } from '../../createGitHubIssues.useCase';
import { CreateGitHubIssuesInMemoryIssueCreator } from '../createGitHubIssues.inMemoryIssueCreator';
import type { CreatesIssuesFromHierarchizedElementsDsl, UpdatesExistingIssuesIdempotentlyDsl, ScenarioIssueHasTestDriversDsl, UploadsWireframeAndAddsToBodyDsl, UserStoryIssueBodyContainsBoundedContextDsl, DeletesRemovedScenarioOnResyncDsl, DeletesRemovedActionOnResyncDsl } from '../createGitHubIssues.dsl';
import type { CommandResult } from '../../../../shared/result/commandResult';
import type { ImageAttachment } from '../../githubImageUploader';

export class CreatesIssuesFromHierarchizedElementsDriver
  implements CreatesIssuesFromHierarchizedElementsDsl
{
  private readonly issueCreator = new CreateGitHubIssuesInMemoryIssueCreator();
  private readonly useCase = new CreateGitHubIssuesUseCase(this.issueCreator);
  private hierarchizedElements: HierarchizedElementJson[] = [];
  private result!: CommandResult<string>;

  givenHierarchizedJsonWithTwoTrees(): void {
    this.hierarchizedElements = [
      {
        id: '2:786',
        type: ElementType.OBJECTIVE,
        title: 'Améliorer la qualité globale du delivery',
        childrenIds: ['2:787'],
      },
      {
        id: '2:787',
        type: ElementType.ACTOR,
        title: 'Product Owner',
        parentId: '2:786',
        childrenIds: ['2:790'],
      },
      {
        id: '2:790',
        type: ElementType.IMPACT,
        title: 'Identifier les zones de flou',
        parentId: '2:787',
        childrenIds: ['2:789'],
      },
      {
        id: '2:789',
        type: ElementType.ACTION,
        title: 'Challenger les user stories',
        parentId: '2:790',
        childrenIds: ['2:942'],
      },
      {
        id: '2:942',
        type: ElementType.USER_STORY,
        title: 'Identifier les règles floues',
        body: 'En tant que PO je veux identifier les règles floues',
        parentId: '2:789',
        release: 'MVP',
        childrenIds: ['3:464'],
      },
      {
        id: '3:464',
        type: ElementType.RULE,
        title: 'Les règles doivent être testables',
        body: 'Chaque règle doit pouvoir être validée par un scénario',
        parentId: '2:942',
        release: 'MVP',
        childrenIds: ['3:465', '3:466'],
      },
      {
        id: '3:465',
        type: ElementType.SCENARIO,
        title: 'Scénario règle testable',
        body: 'Given une règle\nWhen on la teste\nThen elle passe',
        text: 'Scénario règle testable\nGiven une règle\nWhen on la teste\nThen elle passe',
        parentId: '3:464',
        release: 'MVP',
        childrenIds: [],
      },
      {
        id: '3:466',
        type: ElementType.SCENARIO,
        title: 'Scénario règle non testable',
        body: 'Given une règle floue\nWhen on essaie\nThen impossible',
        text: 'Scénario règle non testable\nGiven une règle floue\nWhen on essaie\nThen impossible',
        parentId: '3:464',
        release: 'MVP',
        childrenIds: [],
      },
      {
        id: '2:8',
        type: ElementType.OBJECTIVE,
        title: 'Objectif sans user story',
        childrenIds: ['2:9'],
      },
      {
        id: '2:9',
        type: ElementType.ACTOR,
        title: 'Développeur',
        parentId: '2:8',
        childrenIds: ['2:31'],
      },
      {
        id: '2:31',
        type: ElementType.IMPACT,
        title: 'Impact orphelin',
        parentId: '2:9',
        childrenIds: ['2:11'],
      },
      {
        id: '2:11',
        type: ElementType.ACTION,
        title: 'Action orpheline',
        parentId: '2:31',
        childrenIds: [],
      },
    ];
  }

  async whenCreatingGitHubIssues(): Promise<void> {
    this.result = await this.useCase.execute(this.hierarchizedElements);
  }

  thenSevenIssuesCreatedForBranchWithUserStories(): void {
    expect(this.result.isSuccess()).toBe(true);
    expect(this.issueCreator.createdIssues).toHaveLength(7);
  }

  thenAllIssuesHaveMilestoneMVP(): void {
    for (const issue of this.issueCreator.createdIssues) {
      expect(issue.milestone).toBe('MVP');
    }
  }

  thenEachIssueHasCorrectTypeTitleAndElementId(): void {
    const byElementId = new Map(
      this.issueCreator.createdIssues.map((i) => [i.elementId, i]),
    );

    const obj = byElementId.get('2:786')!;
    expect(obj.type).toBe(ElementType.OBJECTIVE);
    expect(obj.title).toBe('Améliorer la qualité globale du delivery');

    const actor = byElementId.get('2:787')!;
    expect(actor.type).toBe(ElementType.ACTOR);
    expect(actor.title).toBe('Product Owner');

    const impact = byElementId.get('2:790')!;
    expect(impact.type).toBe(ElementType.IMPACT);
    expect(impact.title).toBe('Identifier les zones de flou');

    const action = byElementId.get('2:789')!;
    expect(action.type).toBe(ElementType.ACTION);
    expect(action.title).toBe('Challenger les user stories');

    const userStory = byElementId.get('2:942')!;
    expect(userStory.type).toBe(ElementType.USER_STORY);
    expect(userStory.title).toBe('Identifier les règles floues');

    const scenario1 = byElementId.get('3:465')!;
    expect(scenario1.type).toBe(ElementType.SCENARIO);
    expect(scenario1.title).toBe('Scénario règle testable');

    const scenario2 = byElementId.get('3:466')!;
    expect(scenario2.type).toBe(ElementType.SCENARIO);
    expect(scenario2.title).toBe('Scénario règle non testable');
  }

  thenRuleIsNotCreatedAsIssue(): void {
    const elementIds = this.issueCreator.createdIssues.map((i) => i.elementId);
    expect(elementIds).not.toContain('3:464');
  }

  thenIssueBodyMatchesElementBody(): void {
    const byElementId = new Map(
      this.issueCreator.createdIssues.map((i) => [i.elementId, i]),
    );
    const objective = byElementId.get('2:786')!;
    expect(objective.body).toBe('');
  }

  thenUserStoryBodyContainsRules(): void {
    const byElementId = new Map(
      this.issueCreator.createdIssues.map((i) => [i.elementId, i]),
    );
    const userStory = byElementId.get('2:942')!;
    expect(userStory.body).toBe(
      'En tant que PO je veux identifier les règles floues\n## Règles\n- Les règles doivent être testables: Chaque règle doit pouvoir être validée par un scénario',
    );
  }

  thenScenariosAreSubissuesOfUserStory(): void {
    const byElementId = new Map(
      this.issueCreator.createdIssues.map((i) => [i.elementId, i]),
    );
    expect(byElementId.get('3:465')!.parentElementId).toBe('2:942');
    expect(byElementId.get('3:466')!.parentElementId).toBe('2:942');
  }

  thenParentIssuesMirrorHierarchy(): void {
    const byElementId = new Map(
      this.issueCreator.createdIssues.map((i) => [i.elementId, i]),
    );

    expect(byElementId.get('2:786')!.parentElementId).toBeUndefined();
    expect(byElementId.get('2:787')!.parentElementId).toBe('2:786');
    expect(byElementId.get('2:790')!.parentElementId).toBe('2:787');
    expect(byElementId.get('2:789')!.parentElementId).toBe('2:790');
    expect(byElementId.get('2:942')!.parentElementId).toBe('2:789');
    expect(byElementId.get('3:465')!.parentElementId).toBe('2:942');
    expect(byElementId.get('3:466')!.parentElementId).toBe('2:942');
  }

  thenIssueBodyIsTextAfterTitleWithLineBreaksPreserved(): void {
    const byElementId = new Map(
      this.issueCreator.createdIssues.map((i) => [i.elementId, i]),
    );
    const scenario = byElementId.get('3:465')!;
    expect(scenario.body).toBe('Given une règle\nWhen on la teste\nThen elle passe');
  }

  thenNoIssuesForBranchWithoutUserStories(): void {
    const elementIds = this.issueCreator.createdIssues.map((i) => i.elementId);
    expect(elementIds).not.toContain('2:8');
    expect(elementIds).not.toContain('2:9');
    expect(elementIds).not.toContain('2:31');
    expect(elementIds).not.toContain('2:11');
  }
}

export class UpdatesExistingIssuesIdempotentlyDriver
  implements UpdatesExistingIssuesIdempotentlyDsl
{
  private readonly issueCreator = new CreateGitHubIssuesInMemoryIssueCreator();
  private readonly useCase = new CreateGitHubIssuesUseCase(this.issueCreator);
  private hierarchizedElements: HierarchizedElementJson[] = [];

  givenHierarchizedJsonWithTwoTrees(): void {
    this.hierarchizedElements = [
      {
        id: '2:786',
        type: ElementType.OBJECTIVE,
        title: 'Améliorer la qualité globale du delivery',
        childrenIds: ['2:787'],
      },
      {
        id: '2:787',
        type: ElementType.ACTOR,
        title: 'Product Owner',
        parentId: '2:786',
        childrenIds: ['2:790'],
      },
      {
        id: '2:790',
        type: ElementType.IMPACT,
        title: 'Identifier les zones de flou',
        parentId: '2:787',
        childrenIds: ['2:789'],
      },
      {
        id: '2:789',
        type: ElementType.ACTION,
        title: 'Challenger les user stories',
        parentId: '2:790',
        childrenIds: ['2:942'],
      },
      {
        id: '2:942',
        type: ElementType.USER_STORY,
        title: 'Identifier les règles floues',
        body: 'En tant que PO je veux identifier les règles floues',
        parentId: '2:789',
        release: 'MVP',
        childrenIds: ['3:464'],
      },
      {
        id: '3:464',
        type: ElementType.RULE,
        title: 'Les règles doivent être testables',
        body: 'Chaque règle doit pouvoir être validée par un scénario',
        parentId: '2:942',
        release: 'MVP',
        childrenIds: ['3:465', '3:466'],
      },
      {
        id: '3:465',
        type: ElementType.SCENARIO,
        title: 'Scénario règle testable',
        body: 'Given une règle\nWhen on la teste\nThen elle passe',
        text: 'Scénario règle testable\nGiven une règle\nWhen on la teste\nThen elle passe',
        parentId: '3:464',
        release: 'MVP',
        childrenIds: [],
      },
      {
        id: '3:466',
        type: ElementType.SCENARIO,
        title: 'Scénario règle non testable',
        body: 'Given une règle floue\nWhen on essaie\nThen impossible',
        text: 'Scénario règle non testable\nGiven une règle floue\nWhen on essaie\nThen impossible',
        parentId: '3:464',
        release: 'MVP',
        childrenIds: [],
      },
      {
        id: '2:8',
        type: ElementType.OBJECTIVE,
        title: 'Objectif sans user story',
        childrenIds: ['2:9'],
      },
      {
        id: '2:9',
        type: ElementType.ACTOR,
        title: 'Développeur',
        parentId: '2:8',
        childrenIds: ['2:31'],
      },
      {
        id: '2:31',
        type: ElementType.IMPACT,
        title: 'Impact orphelin',
        parentId: '2:9',
        childrenIds: ['2:11'],
      },
      {
        id: '2:11',
        type: ElementType.ACTION,
        title: 'Action orpheline',
        parentId: '2:31',
        childrenIds: [],
      },
    ];
  }

  async whenCreatingGitHubIssuesTwice(): Promise<void> {
    await this.useCase.execute(this.hierarchizedElements);
    await this.useCase.execute(this.hierarchizedElements);
  }

  thenSecondCallUpdatesInsteadOfCreating(): void {
    expect(this.issueCreator.callHistory).toHaveLength(2);

    const firstCall = this.issueCreator.callHistory[0];
    expect(firstCall.created).toHaveLength(7);
    expect(firstCall.updated).toHaveLength(0);

    const secondCall = this.issueCreator.callHistory[1];
    expect(secondCall.created).toHaveLength(0);
    expect(secondCall.updated).toHaveLength(7);
  }

  thenNoIssuesAreDuplicated(): void {
    expect(this.issueCreator.createdIssues).toHaveLength(7);
  }
}

export class ScenarioIssueHasTestDriversDriver
  implements ScenarioIssueHasTestDriversDsl
{
  private readonly issueCreator = new CreateGitHubIssuesInMemoryIssueCreator();
  private readonly useCase = new CreateGitHubIssuesUseCase(this.issueCreator);
  private hierarchizedElements: HierarchizedElementJson[] = [];
  private result!: CommandResult<string>;

  givenHierarchizedJsonWithScenarioTestDrivers(): void {
    this.hierarchizedElements = [
      {
        id: '2:786',
        type: ElementType.OBJECTIVE,
        title: 'Améliorer la qualité globale du delivery',
        childrenIds: ['2:787'],
      },
      {
        id: '2:787',
        type: ElementType.ACTOR,
        title: 'Product Owner',
        parentId: '2:786',
        childrenIds: ['2:790'],
      },
      {
        id: '2:790',
        type: ElementType.IMPACT,
        title: 'Identifier les zones de flou',
        parentId: '2:787',
        childrenIds: ['2:789'],
      },
      {
        id: '2:789',
        type: ElementType.ACTION,
        title: 'Challenger les user stories',
        parentId: '2:790',
        childrenIds: ['2:942'],
      },
      {
        id: '2:942',
        type: ElementType.USER_STORY,
        title: 'Identifier les règles floues',
        body: 'En tant que PO je veux identifier les règles floues',
        parentId: '2:789',
        release: 'MVP',
        childrenIds: ['3:464'],
      },
      {
        id: '3:464',
        type: ElementType.RULE,
        title: 'Les règles doivent être testables',
        body: 'Chaque règle doit pouvoir être validée par un scénario',
        parentId: '2:942',
        release: 'MVP',
        childrenIds: ['3:465'],
      },
      {
        id: '3:465',
        type: ElementType.SCENARIO,
        title: 'Scénario règle testable',
        body: 'Given une règle\nWhen on la teste\nThen elle passe',
        text: 'Scénario règle testable\nGiven une règle\nWhen on la teste\nThen elle passe',
        testDrivers: ['ui', 'backend-e2e', 'backend-use-case'],
        parentId: '3:464',
        release: 'MVP',
        childrenIds: [],
      },
    ];
  }

  async whenCreatingGitHubIssues(): Promise<void> {
    this.result = await this.useCase.execute(this.hierarchizedElements);
  }

  thenScenarioIssueHasTestDrivers(): void {
    expect(this.result.isSuccess()).toBe(true);
    const byElementId = new Map(
      this.issueCreator.createdIssues.map((i) => [i.elementId, i]),
    );
    const scenario = byElementId.get('3:465')!;
    expect(scenario.testDrivers).toEqual(['ui', 'backend-e2e', 'backend-use-case']);
  }
}

export class UploadsWireframeAndAddsToBodyDriver
  implements UploadsWireframeAndAddsToBodyDsl
{
  private readonly issueCreator = new CreateGitHubIssuesInMemoryIssueCreator();
  private readonly useCase = new CreateGitHubIssuesUseCase(this.issueCreator);
  private hierarchizedElements: HierarchizedElementJson[] = [];
  private attachmentsByElementId: Record<string, ImageAttachment[]> = {};
  private result!: CommandResult<string>;

  givenAUserStoryWithAttachment(): void {
    this.hierarchizedElements = [
      {
        id: '2:786',
        type: ElementType.OBJECTIVE,
        title: 'Objective',
        childrenIds: ['2:787'],
      },
      {
        id: '2:787',
        type: ElementType.ACTOR,
        title: 'Actor',
        parentId: '2:786',
        childrenIds: ['2:790'],
      },
      {
        id: '2:790',
        type: ElementType.IMPACT,
        title: 'Impact',
        parentId: '2:787',
        childrenIds: ['2:789'],
      },
      {
        id: '2:789',
        type: ElementType.ACTION,
        title: 'Action',
        parentId: '2:790',
        childrenIds: ['2:942'],
      },
      {
        id: '2:942',
        type: ElementType.USER_STORY,
        title: 'Story with wireframe',
        body: 'Story description',
        parentId: '2:789',
        release: 'MVP',
        childrenIds: [],
      },
    ];
    this.attachmentsByElementId = {
      '2:942': [
        { name: 'login-wireframe', bytes: new Uint8Array([1, 2, 3]) },
      ],
    };
  }

  async whenCreatingGitHubIssues(): Promise<void> {
    this.result = await this.useCase.execute(this.hierarchizedElements, this.attachmentsByElementId);
  }

  thenImageIsUploadedAndBodyContainsWireframe(): void {
    expect(this.result.isSuccess()).toBe(true);
    const byElementId = new Map(
      this.issueCreator.createdIssues.map((i) => [i.elementId, i]),
    );
    const story = byElementId.get('2:942')!;
    expect(story.attachments).toHaveLength(1);
    expect(story.attachments[0].name).toBe('login-wireframe');
    expect(story.attachments[0].bytes).toEqual(new Uint8Array([1, 2, 3]));
  }
}

export class UserStoryIssueBodyContainsBoundedContextDriver
  implements UserStoryIssueBodyContainsBoundedContextDsl
{
  private readonly issueCreator = new CreateGitHubIssuesInMemoryIssueCreator();
  private readonly useCase = new CreateGitHubIssuesUseCase(this.issueCreator);
  private hierarchizedElements: HierarchizedElementJson[] = [];
  private result!: CommandResult<string>;

  givenAUserStoryWithBoundedContext(): void {
    this.hierarchizedElements = [
      {
        id: '2:786',
        type: ElementType.OBJECTIVE,
        title: 'Objective',
        childrenIds: ['2:787'],
      },
      {
        id: '2:787',
        type: ElementType.ACTOR,
        title: 'Actor',
        parentId: '2:786',
        childrenIds: ['2:790'],
      },
      {
        id: '2:790',
        type: ElementType.IMPACT,
        title: 'Impact',
        parentId: '2:787',
        childrenIds: ['2:789'],
      },
      {
        id: '2:789',
        type: ElementType.ACTION,
        title: 'Action',
        parentId: '2:790',
        childrenIds: ['2:942'],
      },
      {
        id: '2:942',
        type: ElementType.USER_STORY,
        title: 'Story with BC',
        body: 'Story description',
        boundedContext: 'Paiement',
        parentId: '2:789',
        release: 'MVP',
        childrenIds: [],
      },
    ];
  }

  async whenCreatingGitHubIssues(): Promise<void> {
    this.result = await this.useCase.execute(this.hierarchizedElements);
  }

  thenIssueBodyContainsBoundedContext(): void {
    expect(this.result.isSuccess()).toBe(true);
    const byElementId = new Map(
      this.issueCreator.createdIssues.map((i) => [i.elementId, i]),
    );
    const story = byElementId.get('2:942')!;
    expect(story.body).toContain('## Bounded Context');
    expect(story.body).toContain('Paiement');
  }
}

export class DeletesRemovedScenarioOnResyncDriver
  implements DeletesRemovedScenarioOnResyncDsl
{
  private readonly issueCreator = new CreateGitHubIssuesInMemoryIssueCreator();
  private readonly useCase = new CreateGitHubIssuesUseCase(this.issueCreator);
  private initialElements: HierarchizedElementJson[] = [];
  private resyncElements: HierarchizedElementJson[] = [];

  givenHierarchizedJsonWithUserStoryAndTwoScenarios(): void {
    this.initialElements = [
      {
        id: '2:786',
        type: ElementType.OBJECTIVE,
        title: 'Objective',
        childrenIds: ['2:787'],
      },
      {
        id: '2:787',
        type: ElementType.ACTOR,
        title: 'Actor',
        parentId: '2:786',
        childrenIds: ['2:790'],
      },
      {
        id: '2:790',
        type: ElementType.IMPACT,
        title: 'Impact',
        parentId: '2:787',
        childrenIds: ['2:789'],
      },
      {
        id: '2:789',
        type: ElementType.ACTION,
        title: 'Action',
        parentId: '2:790',
        childrenIds: ['2:942'],
      },
      {
        id: '2:942',
        type: ElementType.USER_STORY,
        title: 'User story',
        body: 'En tant que PO',
        parentId: '2:789',
        release: 'MVP',
        childrenIds: ['3:464'],
      },
      {
        id: '3:464',
        type: ElementType.RULE,
        title: 'Règle',
        parentId: '2:942',
        release: 'MVP',
        childrenIds: ['3:465', '3:466'],
      },
      {
        id: '3:465',
        type: ElementType.SCENARIO,
        title: 'Scénario A',
        body: 'Given A',
        text: 'Scénario A\nGiven A',
        parentId: '3:464',
        release: 'MVP',
        childrenIds: [],
      },
      {
        id: '3:466',
        type: ElementType.SCENARIO,
        title: 'Scénario B',
        body: 'Given B',
        text: 'Scénario B\nGiven B',
        parentId: '3:464',
        release: 'MVP',
        childrenIds: [],
      },
    ];

    this.resyncElements = [
      {
        id: '2:786',
        type: ElementType.OBJECTIVE,
        title: 'Objective',
        childrenIds: ['2:787'],
      },
      {
        id: '2:787',
        type: ElementType.ACTOR,
        title: 'Actor',
        parentId: '2:786',
        childrenIds: ['2:790'],
      },
      {
        id: '2:790',
        type: ElementType.IMPACT,
        title: 'Impact',
        parentId: '2:787',
        childrenIds: ['2:789'],
      },
      {
        id: '2:789',
        type: ElementType.ACTION,
        title: 'Action',
        parentId: '2:790',
        childrenIds: ['2:942'],
      },
      {
        id: '2:942',
        type: ElementType.USER_STORY,
        title: 'User story',
        body: 'En tant que PO',
        parentId: '2:789',
        release: 'MVP',
        childrenIds: ['3:464'],
      },
      {
        id: '3:464',
        type: ElementType.RULE,
        title: 'Règle',
        parentId: '2:942',
        release: 'MVP',
        childrenIds: ['3:465'],
      },
      {
        id: '3:465',
        type: ElementType.SCENARIO,
        title: 'Scénario A',
        body: 'Given A',
        text: 'Scénario A\nGiven A',
        parentId: '3:464',
        release: 'MVP',
        childrenIds: [],
      },
    ];
  }

  async whenCreatingThenResyncingWithOneScenarioRemoved(): Promise<void> {
    await this.useCase.execute(this.initialElements);
    await this.useCase.execute(this.resyncElements);
  }

  thenRemovedScenarioIsDeleted(): void {
    expect(this.issueCreator.deletedElementIds).toContain('3:466');
  }

  thenRemainingScenarioIsStillPresent(): void {
    const remainingIds = this.issueCreator.createdIssues.map((i) => i.elementId);
    expect(remainingIds).toContain('3:465');
    expect(remainingIds).not.toContain('3:466');
  }
}

export class DeletesRemovedActionOnResyncDriver
  implements DeletesRemovedActionOnResyncDsl
{
  private readonly issueCreator = new CreateGitHubIssuesInMemoryIssueCreator();
  private readonly useCase = new CreateGitHubIssuesUseCase(this.issueCreator);
  private initialElements: HierarchizedElementJson[] = [];
  private resyncElements: HierarchizedElementJson[] = [];

  givenHierarchizedJsonWithImpactAndTwoActions(): void {
    this.initialElements = [
      {
        id: '1:1',
        type: ElementType.OBJECTIVE,
        title: 'Objective',
        childrenIds: ['1:2'],
      },
      {
        id: '1:2',
        type: ElementType.ACTOR,
        title: 'Actor',
        parentId: '1:1',
        childrenIds: ['1:3'],
      },
      {
        id: '1:3',
        type: ElementType.IMPACT,
        title: 'Impact',
        parentId: '1:2',
        childrenIds: ['1:4', '1:5'],
      },
      {
        id: '1:4',
        type: ElementType.ACTION,
        title: 'Action A',
        parentId: '1:3',
        childrenIds: ['1:6'],
      },
      {
        id: '1:5',
        type: ElementType.ACTION,
        title: 'Action B',
        parentId: '1:3',
        childrenIds: ['1:7'],
      },
      {
        id: '1:6',
        type: ElementType.USER_STORY,
        title: 'US de Action A',
        body: 'Body A',
        parentId: '1:4',
        release: 'MVP',
        childrenIds: [],
      },
      {
        id: '1:7',
        type: ElementType.USER_STORY,
        title: 'US de Action B',
        body: 'Body B',
        parentId: '1:5',
        release: 'MVP',
        childrenIds: [],
      },
    ];

    this.resyncElements = [
      {
        id: '1:1',
        type: ElementType.OBJECTIVE,
        title: 'Objective',
        childrenIds: ['1:2'],
      },
      {
        id: '1:2',
        type: ElementType.ACTOR,
        title: 'Actor',
        parentId: '1:1',
        childrenIds: ['1:3'],
      },
      {
        id: '1:3',
        type: ElementType.IMPACT,
        title: 'Impact',
        parentId: '1:2',
        childrenIds: ['1:4'],
      },
      {
        id: '1:4',
        type: ElementType.ACTION,
        title: 'Action A',
        parentId: '1:3',
        childrenIds: ['1:6'],
      },
      {
        id: '1:6',
        type: ElementType.USER_STORY,
        title: 'US de Action A',
        body: 'Body A',
        parentId: '1:4',
        release: 'MVP',
        childrenIds: [],
      },
    ];
  }

  async whenCreatingThenResyncingWithOneActionRemoved(): Promise<void> {
    await this.useCase.execute(this.initialElements);
    await this.useCase.execute(this.resyncElements);
  }

  thenRemovedActionIsDeleted(): void {
    expect(this.issueCreator.deletedElementIds).toContain('1:5');
  }

  thenRemainingActionIsStillPresent(): void {
    const remainingIds = this.issueCreator.createdIssues.map((i) => i.elementId);
    expect(remainingIds).toContain('1:4');
    expect(remainingIds).not.toContain('1:5');
  }
}
