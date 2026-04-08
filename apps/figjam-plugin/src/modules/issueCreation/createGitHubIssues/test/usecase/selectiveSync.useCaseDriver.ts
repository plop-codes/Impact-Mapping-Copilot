import { expect } from 'vitest';
import { ElementType } from '../../../../boardAnalysis/element';
import type { HierarchizedElementJson } from '../../../../boardAnalysis/impactMapping';
import { IssuableElements } from '../../../issuableElements';
import type {
  SyncsSelectedUserStoryWithChildrenDsl,
  SyncsSelectedRuleAsParentUserStoryDsl,
  SyncsSelectedScenarioOnlyDsl,
  ScenarioBodyFallbackFromTextDsl,
  ReturnsEmptyForActorWithoutDescendantUserStoryDsl,
} from '../selectiveSync.dsl';

function buildTwoTreesHierarchy(): HierarchizedElementJson[] {
  return [
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

export class SyncsSelectedUserStoryWithChildrenDriver
  implements SyncsSelectedUserStoryWithChildrenDsl
{
  private hierarchizedElements: HierarchizedElementJson[] = [];
  private result!: IssuableElements;

  givenHierarchizedJsonWithTwoTrees(): void {
    this.hierarchizedElements = buildTwoTreesHierarchy();
  }

  whenSyncingSelectedUserStory(): void {
    this.result = IssuableElements.fromSelectedElements(
      ['2:942'],
      this.hierarchizedElements,
    );
  }

  thenUserStoryAndDescendantScenariosAreIssuable(): void {
    expect(this.result.items).toHaveLength(3);
    const types = this.result.items.map((i) => i.type);
    expect(types).toContain(ElementType.USER_STORY);
    expect(types.filter((t) => t === ElementType.SCENARIO)).toHaveLength(2);
    const ids = this.result.items.map((i) => i.elementId);
    expect(ids).toContain('2:942');
    expect(ids).toContain('3:465');
    expect(ids).toContain('3:466');
  }
}

export class SyncsSelectedRuleAsParentUserStoryDriver
  implements SyncsSelectedRuleAsParentUserStoryDsl
{
  private hierarchizedElements: HierarchizedElementJson[] = [];
  private result!: IssuableElements;

  givenHierarchizedJsonWithTwoTrees(): void {
    this.hierarchizedElements = buildTwoTreesHierarchy();
  }

  whenSyncingSelectedRule(): void {
    this.result = IssuableElements.fromSelectedElements(
      ['3:464'],
      this.hierarchizedElements,
    );
  }

  thenParentUserStoryIsIssuable(): void {
    const userStory = this.result.items.find((i) => i.type === ElementType.USER_STORY);
    expect(userStory).toBeDefined();
    expect(userStory!.elementId).toBe('2:942');
  }

  thenUserStoryBodyContainsRules(): void {
    expect(this.result.items[0].body).toContain('## Règles');
    expect(this.result.items[0].body).toContain('Les règles doivent être testables');
  }
}

export class SyncsSelectedScenarioOnlyDriver
  implements SyncsSelectedScenarioOnlyDsl
{
  private hierarchizedElements: HierarchizedElementJson[] = [];
  private result!: IssuableElements;

  givenHierarchizedJsonWithTwoTrees(): void {
    this.hierarchizedElements = buildTwoTreesHierarchy();
  }

  whenSyncingSelectedScenario(): void {
    this.result = IssuableElements.fromSelectedElements(
      ['3:465'],
      this.hierarchizedElements,
    );
  }

  thenOnlyScenarioIsIssuable(): void {
    expect(this.result.items).toHaveLength(1);
    expect(this.result.items[0].elementId).toBe('3:465');
    expect(this.result.items[0].type).toBe(ElementType.SCENARIO);
  }

  thenScenarioParentIsUserStory(): void {
    expect(this.result.items[0].parentElementId).toBe('2:942');
  }
}

export class ScenarioBodyFallbackFromTextDriver
  implements ScenarioBodyFallbackFromTextDsl
{
  private hierarchizedElements: HierarchizedElementJson[] = [];
  private result!: IssuableElements;

  givenHierarchizedJsonWithScenarioWithoutBody(): void {
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
        title: 'User story',
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
        title: 'Scénario règle testable',
        text: 'Scénario règle testable\nÉtant donné une règle\nQuand on la teste\nAlors elle passe',
        parentId: '3:464',
        release: 'MVP',
        childrenIds: [],
      },
    ];
  }

  whenSyncingSelectedUserStory(): void {
    this.result = IssuableElements.fromSelectedElements(
      ['2:942'],
      this.hierarchizedElements,
    );
  }

  thenScenarioBodyIsFallbackFromText(): void {
    const scenario = this.result.items.find((i) => i.type === ElementType.SCENARIO);
    expect(scenario).toBeDefined();
    expect(scenario!.body).toBe('Étant donné une règle\nQuand on la teste\nAlors elle passe');
  }
}

export class ReturnsEmptyForActorWithoutDescendantUserStoryDriver
  implements ReturnsEmptyForActorWithoutDescendantUserStoryDsl
{
  private hierarchizedElements: HierarchizedElementJson[] = [];
  private result!: IssuableElements;

  givenHierarchizedJsonWithTwoTrees(): void {
    this.hierarchizedElements = buildTwoTreesHierarchy();
  }

  whenSyncingActorWithoutDescendantUserStory(): void {
    this.result = IssuableElements.fromSelectedElements(
      ['2:9'],
      this.hierarchizedElements,
    );
  }

  thenNoElementsAreIssuable(): void {
    expect(this.result.items).toHaveLength(0);
  }
}
