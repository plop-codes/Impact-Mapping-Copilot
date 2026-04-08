import { expect } from 'vitest';
import { ElementType } from '../../../element';
import { AnalyzeImpactMapUseCase } from '../../analyzeImpactMap.useCase';
import type { ImpactMappingJson } from '../../../impactMapping';
import { AnalyzeImpactMapInMemoryBoardReader } from '../analyzeImpactMap.inMemoryBoardReader';
import { CommandResult } from '../../../../shared/result/commandResult';
import type { HierarchizedElementJson } from '../../../impactMapping';
import type {
  DetectsObjectiveByColorDsl,
  DetectsAllTypesByColorDsl,
  IgnoresUnknownColorDsl,
  IgnoresEmptyTextDsl,
  IgnoresNonRectangleShapesDsl,
  DetectsReleaseSectionDsl,
  IgnoresSectionsWithEmptyNameDsl,
  BuildsLinearHierarchyDsl,
  HandlesMultipleChildrenDsl,
  AssignsAndPropagatesReleaseDsl,
  ExcludesShapesWithoutConnectorDsl,
  RejectsElementWithMultipleParentsDsl,
  ExtractsTitleFromBoldTextDsl,
  ExtractsBodyFromNonBoldTextDsl,
  HasNoBodyWhenAllTextIsBoldDsl,
  IgnoresBackboneSectionDsl,
  WarnsWhenScenarioHasNoBodyDsl,
  WarnsWhenTitleIsTooLongDsl,
  NoWarningsWhenFormattingIsCorrectDsl,
  FullIntegrationDsl,
  ExtractsTestDriversFromScenarioTextDsl,
  StripsTestDriversBracketsFromBodyDsl,
  HasNoTestDriversWhenNoBracketsDsl,
  DetectsAttachmentConnectedToUserStoryDsl,
  IgnoresAttachmentConnectedToObjectiveDsl,
  DetectsBoundedContextConnectedToUserStoryDsl,
  IgnoresBoundedContextConnectedToObjectiveDsl,
  ExcludesVisionProduitFromReleasesDsl,
  ExcludesActeursOperationnelsFromReleasesDsl,
  ExtractsTestDriversWithCommaAndQuotesDsl,
  ExtractsTestDriversFromTopOfScenarioDsl,
  DetectsDomainConnectedToBcConnectedToUserStoryDsl,
  IgnoresDomainConnectedDirectlyToUserStoryDsl,
} from '../analyzeImpactMap.dsl';

function findById(elements: HierarchizedElementJson[], id: string): HierarchizedElementJson {
  const found = elements.find((e) => e.id === id);
  if (!found) throw new Error(`Element ${id} not found`);
  return found;
}

export class DetectsObjectiveByColorDriver
  implements DetectsObjectiveByColorDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenABoardWithAnObjectiveShape(): void {
    this.boardReader.feedShapes([
      {
        id: 'obj-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#1E3A8A',
        text: 'Améliorer la qualité',
      },
      {
        id: 'actor-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#7C3AED',
        text: 'Actor',
      },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenOneObjectiveElementIsDetected(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const obj = findById(json.hierarchizedElements, 'obj-1');
    expect(obj.type).toBe(ElementType.OBJECTIVE);
    expect(obj.title).toBe('Améliorer la qualité');
  }
}

export class DetectsAllTypesByColorDriver
  implements DetectsAllTypesByColorDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenABoardWithOneShapePerType(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'SQUARE', fillColor: '#1E3A8A', text: 'Objective' },
      { id: 'actor-1', shapeType: 'SQUARE', fillColor: '#7C3AED', text: 'Actor' },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact' },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#EA580C', text: 'Action' },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#FACC15', text: 'User Story' },
      { id: 'rule-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#64748B', text: 'Rule' },
      { id: 'scenario-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#CBD5E1', text: 'Scenario' },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
      { startNodeId: 'story-1', endNodeId: 'rule-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenAllTypesAreDetected(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const els = json.hierarchizedElements;
    expect(findById(els, 'obj-1').type).toBe(ElementType.OBJECTIVE);
    expect(findById(els, 'actor-1').type).toBe(ElementType.ACTOR);
    expect(findById(els, 'impact-1').type).toBe(ElementType.IMPACT);
    expect(findById(els, 'action-1').type).toBe(ElementType.ACTION);
    expect(findById(els, 'story-1').type).toBe(ElementType.USER_STORY);
    expect(findById(els, 'rule-1').type).toBe(ElementType.RULE);
    expect(findById(els, 'scenario-1').type).toBe(ElementType.SCENARIO);
  }
}

export class IgnoresUnknownColorDriver implements IgnoresUnknownColorDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenABoardWithAnUnknownColorShape(): void {
    this.boardReader.feedShapes([
      {
        id: 'unknown-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#FF0000',
        text: 'Unknown',
      },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenNoElementIsDetected(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    expect(json.hierarchizedElements).toHaveLength(0);
  }
}

export class IgnoresEmptyTextDriver implements IgnoresEmptyTextDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenABoardWithAnEmptyTextShape(): void {
    this.boardReader.feedShapes([
      {
        id: 'empty-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#1E3A8A',
        text: '   ',
      },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenNoElementIsDetected(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    expect(json.hierarchizedElements).toHaveLength(0);
  }
}

export class IgnoresNonRectangleShapesDriver
  implements IgnoresNonRectangleShapesDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenABoardWithNonRectangleShapes(): void {
    this.boardReader.feedShapes([
      { id: 'ellipse-1', shapeType: 'ELLIPSE', fillColor: '#1E3A8A', text: 'Objective' },
      { id: 'diamond-1', shapeType: 'DIAMOND', fillColor: '#7C3AED', text: 'Actor' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenNoElementIsDetected(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    expect(json.hierarchizedElements).toHaveLength(0);
  }
}

export class DetectsReleaseSectionDriver implements DetectsReleaseSectionDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenASectionAndAnElementInsideIt(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective', x: 100, y: 100, width: 200, height: 100 },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor', x: 100, y: 100, width: 200, height: 100 },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact', x: 100, y: 100, width: 200, height: 100 },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#EA580C', text: 'Action', x: 100, y: 100, width: 200, height: 100 },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#FACC15', text: 'A user story', x: 100, y: 100, width: 200, height: 100 },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
    ]);
    this.boardReader.feedSections([
      { name: 'MVP', x: 0, y: 0, width: 500, height: 500 },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenTheElementIsAssignedToTheRelease(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const story = findById(json.hierarchizedElements, 'story-1');
    expect(story.release).toBe('MVP');
  }
}

export class IgnoresSectionsWithEmptyNameDriver
  implements IgnoresSectionsWithEmptyNameDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenASectionWithEmptyNameAndAnElementInsideIt(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective', x: 100, y: 100, width: 200, height: 100 },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor', x: 100, y: 100, width: 200, height: 100 },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact', x: 100, y: 100, width: 200, height: 100 },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#EA580C', text: 'Action', x: 100, y: 100, width: 200, height: 100 },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#FACC15', text: 'A user story', x: 100, y: 100, width: 200, height: 100 },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
    ]);
    this.boardReader.feedSections([
      { name: '   ', x: 0, y: 0, width: 500, height: 500 },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenNoReleaseIsAssigned(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const story = findById(json.hierarchizedElements, 'story-1');
    expect(story.release).toBeUndefined();
  }
}

export class BuildsLinearHierarchyDriver implements BuildsLinearHierarchyDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenALinearChainOfElements(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective' },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor' },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact' },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenALinearHierarchyIsProduced(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const els = json.hierarchizedElements;
    expect(els).toHaveLength(3);

    const obj = findById(els, 'obj-1');
    expect(obj.type).toBe(ElementType.OBJECTIVE);
    expect(obj.parentId).toBeUndefined();
    expect(obj.childrenIds).toEqual(['actor-1']);

    const actor = findById(els, 'actor-1');
    expect(actor.parentId).toBe('obj-1');
    expect(actor.childrenIds).toEqual(['impact-1']);

    const impact = findById(els, 'impact-1');
    expect(impact.parentId).toBe('actor-1');
    expect(impact.childrenIds).toEqual([]);
  }
}

export class HandlesMultipleChildrenDriver
  implements HandlesMultipleChildrenDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenARuleWithTwoScenarios(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective' },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor' },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact' },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#EA580C', text: 'Action' },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#FACC15', text: 'Story' },
      { id: 'rule-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#64748B', text: 'Rule' },
      { id: 'scenario-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#CBD5E1', text: 'Scenario A' },
      { id: 'scenario-2', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#CBD5E1', text: 'Scenario B' },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
      { startNodeId: 'story-1', endNodeId: 'rule-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-2' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenTheRuleHasTwoScenarioChildren(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const rule = findById(json.hierarchizedElements, 'rule-1');
    expect(rule.childrenIds).toHaveLength(2);
    expect(rule.childrenIds).toContain('scenario-1');
    expect(rule.childrenIds).toContain('scenario-2');
  }
}

export class AssignsAndPropagatesReleaseDriver
  implements AssignsAndPropagatesReleaseDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenAUserStoryWithReleaseAndChildren(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective' },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor' },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact' },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#EA580C', text: 'Action' },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#FACC15', text: 'Story', x: 100, y: 100, width: 200, height: 100 },
      { id: 'rule-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#64748B', text: 'Rule' },
      { id: 'scenario-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#CBD5E1', text: 'Scenario' },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
      { startNodeId: 'story-1', endNodeId: 'rule-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-1' },
    ]);
    this.boardReader.feedSections([
      { name: 'MVP', x: 0, y: 0, width: 500, height: 500 },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenReleaseIsPropagatedToChildren(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const els = json.hierarchizedElements;

    expect(findById(els, 'story-1').release).toBe('MVP');
    expect(findById(els, 'rule-1').release).toBe('MVP');
    expect(findById(els, 'scenario-1').release).toBe('MVP');
  }
}

export class ExcludesShapesWithoutConnectorDriver
  implements ExcludesShapesWithoutConnectorDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenElementsWithAndWithoutConnectors(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Connected objective' },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Connected actor' },
      { id: 'obj-2', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Orphan objective' },
      { id: 'actor-2', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Orphan actor' },
      { id: 'impact-solo', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Orphan impact' },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenOnlyConnectedElementsAreInTheHierarchy(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    expect(json.hierarchizedElements).toHaveLength(2);

    const obj = findById(json.hierarchizedElements, 'obj-1');
    expect(obj.childrenIds).toEqual(['actor-1']);

    const actor = findById(json.hierarchizedElements, 'actor-1');
    expect(actor.parentId).toBe('obj-1');
  }
}

export class RejectsElementWithMultipleParentsDriver implements RejectsElementWithMultipleParentsDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenAnElementWithTwoParents(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective 1' },
      { id: 'obj-2', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective 2' },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor partagé' },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'obj-2', endNodeId: 'actor-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenAnalysisFails(): void {
    expect(this.result.isFailure()).toBe(true);
  }
}

export class ExtractsTitleFromBoldTextDriver implements ExtractsTitleFromBoldTextDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenAShapeWithBoldTitleAndBody(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Titre de l\'objectif\nDétails supplémentaires\nEncore une ligne', boldText: 'Titre de l\'objectif' },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor', boldText: 'Actor' },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenTitleIsBoldText(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const obj = findById(json.hierarchizedElements, 'obj-1');
    expect(obj.title).toBe('Titre de l\'objectif');
  }
}

export class ExtractsBodyFromNonBoldTextDriver implements ExtractsBodyFromNonBoldTextDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenAShapeWithBoldTitleAndBody(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Titre de l\'objectif\nDétails supplémentaires\nEncore une ligne', boldText: 'Titre de l\'objectif' },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor', boldText: 'Actor' },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenBodyIsNonBoldText(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const obj = findById(json.hierarchizedElements, 'obj-1');
    expect(obj.body).toBe('Détails supplémentaires\nEncore une ligne');
  }
}

export class HasNoBodyWhenAllTextIsBoldDriver implements HasNoBodyWhenAllTextIsBoldDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenAShapeWithAllBoldText(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Titre simple', boldText: 'Titre simple' },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor', boldText: 'Actor' },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenBodyIsUndefined(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const obj = findById(json.hierarchizedElements, 'obj-1');
    expect(obj.body).toBeUndefined();
  }
}

export class IgnoresBackboneSectionDriver implements IgnoresBackboneSectionDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenABackboneSectionAndAnElementInsideIt(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective', x: 100, y: 100, width: 200, height: 100 },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor', x: 100, y: 100, width: 200, height: 100 },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact', x: 100, y: 100, width: 200, height: 100 },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#EA580C', text: 'Action', x: 100, y: 100, width: 200, height: 100 },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#FACC15', text: 'A user story', x: 100, y: 100, width: 200, height: 100 },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
    ]);
    this.boardReader.feedSections([
      { name: 'Backbone', x: 0, y: 0, width: 500, height: 500 },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenNoReleaseIsAssigned(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const story = findById(json.hierarchizedElements, 'story-1');
    expect(story.release).toBeUndefined();
  }
}

export class WarnsWhenScenarioHasNoBodyDriver implements WarnsWhenScenarioHasNoBodyDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenAScenarioWithAllTextInTitle(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective' },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor' },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact' },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#EA580C', text: 'Action' },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#FACC15', text: 'Story' },
      { id: 'rule-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#64748B', text: 'Rule' },
      { id: 'scenario-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#CBD5E1', text: 'Titre du scénario Etant donné un contexte Quand une action Alors un résultat' },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
      { startNodeId: 'story-1', endNodeId: 'rule-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenAWarningIsGeneratedForMissingBody(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    expect(json.warnings.some((w) => w.includes('scenario-1') && w.includes('sans body'))).toBe(true);
  }
}

export class WarnsWhenTitleIsTooLongDriver implements WarnsWhenTitleIsTooLongDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenAnElementWithAVeryLongTitle(): void {
    const longTitle = 'A'.repeat(101);
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective' },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor' },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact' },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#EA580C', text: 'Action' },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#FACC15', text: 'Story' },
      { id: 'rule-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#64748B', text: 'Rule' },
      { id: 'scenario-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#CBD5E1', text: longTitle },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
      { startNodeId: 'story-1', endNodeId: 'rule-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenAWarningIsGeneratedForLongTitle(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    expect(json.warnings.some((w) => w.includes('scenario-1') && w.includes('Titre trop long'))).toBe(true);
  }
}

export class NoWarningsWhenFormattingIsCorrectDriver implements NoWarningsWhenFormattingIsCorrectDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenElementsWithCorrectBoldFormatting(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective', boldText: 'Objective' },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor', boldText: 'Actor' },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact', boldText: 'Impact' },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#EA580C', text: 'Action', boldText: 'Action' },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#FACC15', text: 'Story', boldText: 'Story' },
      { id: 'rule-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#64748B', text: 'Rule\nDescription de la règle', boldText: 'Rule' },
      { id: 'scenario-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#CBD5E1', text: 'Titre du scénario\nEtant donné un contexte\nQuand une action\nAlors un résultat', boldText: 'Titre du scénario' },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
      { startNodeId: 'story-1', endNodeId: 'rule-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenNoWarningsAreGenerated(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    expect(json.warnings).toHaveLength(0);
  }
}

export class FullIntegrationDriver implements FullIntegrationDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenTheCompleteImpactMappingBoard(): void {
    this.boardReader.feedShapes([
      {
        id: 'obj-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#1E3A8A',
        text: 'Améliorer la qualité globale du delivery pendant les ateliers',
      },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Product Owner' },
      {
        id: 'impact-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#16A34A',
        text: 'Identifier et rendre explicites les zones de flou',
      },
      {
        id: 'action-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#EA580C',
        text: 'Challenger les user stories et règles pendant l\'atelier',
      },
      {
        id: 'story-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#FACC15',
        text: 'En tant que Product Owner, je veux identifier les règles floues afin de clarifier les décisions produit',
        x: 100, y: 100, width: 200, height: 100,
      },
      {
        id: 'rule-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#64748B',
        text: 'Les règles métier doivent être explicites et testables',
      },
      {
        id: 'scenario-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#CBD5E1',
        text: 'Si une règle métier est ambiguë, elle doit être signalée et discutée pendant l\'atelier afin de lever toute interprétation.',
      },
      {
        id: 'scenario-2',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#CBD5E1',
        text: 'Si plusieurs interprétations sont possibles pour une règle, le système doit générer une question de clarification.',
      },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
      { startNodeId: 'story-1', endNodeId: 'rule-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-2' },
    ]);
    this.boardReader.feedSections([
      { name: 'MVP', x: 0, y: 0, width: 500, height: 500 },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenTheExpectedJsonIsProduced(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const els = json.hierarchizedElements;
    expect(els).toHaveLength(8);

    const obj = findById(els, 'obj-1');
    expect(obj.type).toBe(ElementType.OBJECTIVE);
    expect(obj.title).toBe(
      'Améliorer la qualité globale du delivery pendant les ateliers',
    );
    expect(obj.parentId).toBeUndefined();
    expect(obj.release).toBeUndefined();

    const actor = findById(els, 'actor-1');
    expect(actor.parentId).toBe('obj-1');

    const impact = findById(els, 'impact-1');
    expect(impact.parentId).toBe('actor-1');

    const action = findById(els, 'action-1');
    expect(action.parentId).toBe('impact-1');

    const story = findById(els, 'story-1');
    expect(story.parentId).toBe('action-1');
    expect(story.release).toBe('MVP');

    const rule = findById(els, 'rule-1');
    expect(rule.parentId).toBe('story-1');
    expect(rule.release).toBe('MVP');
    expect(rule.childrenIds).toHaveLength(2);

    const scenario1 = findById(els, 'scenario-1');
    expect(scenario1.parentId).toBe('rule-1');
    expect(scenario1.release).toBe('MVP');
    expect(scenario1.text).toBe(
      'Si une règle métier est ambiguë, elle doit être signalée et discutée pendant l\'atelier afin de lever toute interprétation.',
    );

    const scenario2 = findById(els, 'scenario-2');
    expect(scenario2.parentId).toBe('rule-1');
    expect(scenario2.release).toBe('MVP');
    expect(scenario2.text).toBe(
      'Si plusieurs interprétations sont possibles pour une règle, le système doit générer une question de clarification.',
    );
  }
}

function buildFullChainWithScenario(scenarioText: string, scenarioBoldText?: string) {
  return {
    shapes: [
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE' as const, fillColor: '#1E3A8A', text: 'Objective' },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE' as const, fillColor: '#7C3AED', text: 'Actor' },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE' as const, fillColor: '#16A34A', text: 'Impact' },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE' as const, fillColor: '#EA580C', text: 'Action' },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE' as const, fillColor: '#FACC15', text: 'Story' },
      { id: 'rule-1', shapeType: 'ROUNDED_RECTANGLE' as const, fillColor: '#64748B', text: 'Rule' },
      { id: 'scenario-1', shapeType: 'ROUNDED_RECTANGLE' as const, fillColor: '#CBD5E1', text: scenarioText, boldText: scenarioBoldText },
    ],
    connectors: [
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
      { startNodeId: 'story-1', endNodeId: 'rule-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-1' },
    ],
  };
}

export class ExtractsTestDriversFromScenarioTextDriver
  implements ExtractsTestDriversFromScenarioTextDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenAScenarioWithTestDriversBrackets(): void {
    const chain = buildFullChainWithScenario(
      'Titre du scénario\nGiven un contexte\nWhen une action\nThen un résultat [ui / backend-e2e / backend-use-case]',
      'Titre du scénario',
    );
    this.boardReader.feedShapes(chain.shapes);
    this.boardReader.feedConnectors(chain.connectors);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenTestDriversAreExtracted(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const scenario = findById(json.hierarchizedElements, 'scenario-1');
    expect(scenario.testDrivers).toEqual(['ui', 'backend-e2e', 'backend-use-case']);
  }
}

export class StripsTestDriversBracketsFromBodyDriver
  implements StripsTestDriversBracketsFromBodyDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenAScenarioWithTestDriversBrackets(): void {
    const chain = buildFullChainWithScenario(
      'Titre du scénario\nGiven un contexte\nWhen une action\nThen un résultat [ui / backend-e2e]',
      'Titre du scénario',
    );
    this.boardReader.feedShapes(chain.shapes);
    this.boardReader.feedConnectors(chain.connectors);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenBodyDoesNotContainBrackets(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const scenario = findById(json.hierarchizedElements, 'scenario-1');
    expect(scenario.body).toBe('Given un contexte\nWhen une action\nThen un résultat');
    expect(scenario.text).toBe('Titre du scénario\nGiven un contexte\nWhen une action\nThen un résultat');
  }
}

export class HasNoTestDriversWhenNoBracketsDriver
  implements HasNoTestDriversWhenNoBracketsDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenAScenarioWithoutBrackets(): void {
    const chain = buildFullChainWithScenario(
      'Titre du scénario\nGiven un contexte\nWhen une action\nThen un résultat',
      'Titre du scénario',
    );
    this.boardReader.feedShapes(chain.shapes);
    this.boardReader.feedConnectors(chain.connectors);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenTestDriversAreEmpty(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const scenario = findById(json.hierarchizedElements, 'scenario-1');
    expect(scenario.testDrivers).toBeUndefined();
  }
}

function buildFullChainUpToUserStory() {
  return {
    shapes: [
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE' as const, fillColor: '#1E3A8A', text: 'Objective' },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE' as const, fillColor: '#7C3AED', text: 'Actor' },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE' as const, fillColor: '#16A34A', text: 'Impact' },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE' as const, fillColor: '#EA580C', text: 'Action' },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE' as const, fillColor: '#FACC15', text: 'Story' },
    ],
    connectors: [
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
    ],
  };
}

export class DetectsAttachmentConnectedToUserStoryDriver
  implements DetectsAttachmentConnectedToUserStoryDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenAnImageConnectedToAUserStory(): void {
    const chain = buildFullChainUpToUserStory();
    this.boardReader.feedShapes(chain.shapes);
    this.boardReader.feedConnectors([
      ...chain.connectors,
      { startNodeId: 'story-1', endNodeId: 'wireframe-1' },
    ]);
    this.boardReader.feedAttachmentNodes([
      { nodeId: 'wireframe-1', name: 'login-wireframe' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenUserStoryHasAttachmentNodeId(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const story = findById(json.hierarchizedElements, 'story-1');
    expect(story.attachmentNodeIds).toEqual(['wireframe-1']);
    expect(json.attachmentNodes).toEqual([{ nodeId: 'wireframe-1', name: 'login-wireframe' }]);
  }
}

export class IgnoresAttachmentConnectedToObjectiveDriver
  implements IgnoresAttachmentConnectedToObjectiveDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenAnImageConnectedToAnObjective(): void {
    const chain = buildFullChainUpToUserStory();
    this.boardReader.feedShapes(chain.shapes);
    this.boardReader.feedConnectors([
      ...chain.connectors,
      { startNodeId: 'obj-1', endNodeId: 'wireframe-1' },
    ]);
    this.boardReader.feedAttachmentNodes([
      { nodeId: 'wireframe-1', name: 'some-image' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenObjectiveHasNoAttachmentNodeIds(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const obj = findById(json.hierarchizedElements, 'obj-1');
    expect(obj.attachmentNodeIds).toBeUndefined();
    expect(json.attachmentNodes).toBeUndefined();
  }
}

export class DetectsBoundedContextConnectedToUserStoryDriver
  implements DetectsBoundedContextConnectedToUserStoryDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenABoundedContextConnectedToAUserStory(): void {
    const chain = buildFullChainUpToUserStory();
    this.boardReader.feedShapes([
      ...chain.shapes,
      { id: 'bc-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E1E1E', text: 'Paiement' },
    ]);
    this.boardReader.feedConnectors([
      ...chain.connectors,
      { startNodeId: 'bc-1', endNodeId: 'story-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenUserStoryHasBoundedContext(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const story = findById(json.hierarchizedElements, 'story-1');
    expect(story.boundedContext).toBe('Paiement');
  }
}

export class IgnoresBoundedContextConnectedToObjectiveDriver
  implements IgnoresBoundedContextConnectedToObjectiveDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenABoundedContextConnectedToAnObjective(): void {
    const chain = buildFullChainUpToUserStory();
    this.boardReader.feedShapes([
      ...chain.shapes,
      { id: 'bc-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E1E1E', text: 'Paiement' },
    ]);
    this.boardReader.feedConnectors([
      ...chain.connectors,
      { startNodeId: 'bc-1', endNodeId: 'obj-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenObjectiveHasNoBoundedContext(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const obj = findById(json.hierarchizedElements, 'obj-1');
    expect(obj.boundedContext).toBeUndefined();
  }
}

export class ExcludesVisionProduitFromReleasesDriver
  implements ExcludesVisionProduitFromReleasesDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenAVisionProduitSectionAndAnElementInsideIt(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective', x: 100, y: 100, width: 200, height: 100 },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor', x: 100, y: 100, width: 200, height: 100 },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact', x: 100, y: 100, width: 200, height: 100 },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#EA580C', text: 'Action', x: 100, y: 100, width: 200, height: 100 },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#FACC15', text: 'A user story', x: 100, y: 100, width: 200, height: 100 },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
    ]);
    this.boardReader.feedSections([
      { name: 'Vision produit', x: 0, y: 0, width: 500, height: 500 },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenNoReleaseIsAssigned(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const story = findById(json.hierarchizedElements, 'story-1');
    expect(story.release).toBeUndefined();
  }
}

export class ExtractsTestDriversWithCommaAndQuotesDriver
  implements ExtractsTestDriversWithCommaAndQuotesDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenAScenarioWithCommaSeparatedQuotedDrivers(): void {
    const chain = buildFullChainWithScenario(
      "Titre du scénario\nGiven un contexte\nWhen une action\nThen un résultat ['ui', 'backend-e2e', 'backend-use-case']",
      'Titre du scénario',
    );
    this.boardReader.feedShapes(chain.shapes);
    this.boardReader.feedConnectors(chain.connectors);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenTestDriversAreExtractedCorrectly(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const scenario = findById(json.hierarchizedElements, 'scenario-1');
    expect(scenario.testDrivers).toEqual(['ui', 'backend-e2e', 'backend-use-case']);
  }
}

export class ExtractsTestDriversFromTopOfScenarioDriver
  implements ExtractsTestDriversFromTopOfScenarioDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenAScenarioWithTestDriversAtTop(): void {
    const chain = buildFullChainWithScenario(
      '[ui, backend-e2e, backend-use-case]\nTitre du scénario\nGiven un contexte\nWhen une action\nThen un résultat',
      'Titre du scénario',
    );
    this.boardReader.feedShapes(chain.shapes);
    this.boardReader.feedConnectors(chain.connectors);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenTestDriversAreExtracted(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const scenario = findById(json.hierarchizedElements, 'scenario-1');
    expect(scenario.testDrivers).toEqual(['ui', 'backend-e2e', 'backend-use-case']);
  }

  thenTitleDoesNotContainBrackets(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const scenario = findById(json.hierarchizedElements, 'scenario-1');
    expect(scenario.title).toBe('Titre du scénario');
    expect(scenario.body).toBe('Given un contexte\nWhen une action\nThen un résultat');
  }
}

export class DetectsDomainConnectedToBcConnectedToUserStoryDriver
  implements DetectsDomainConnectedToBcConnectedToUserStoryDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenADomainConnectedToABcConnectedToAUserStory(): void {
    const chain = buildFullChainUpToUserStory();
    this.boardReader.feedShapes([
      ...chain.shapes,
      { id: 'bc-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E1E1E', text: 'Paiement' },
      { id: 'domain-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#CDF4D3', text: 'Core Domain' },
    ]);
    this.boardReader.feedConnectors([
      ...chain.connectors,
      { startNodeId: 'bc-1', endNodeId: 'story-1' },
      { startNodeId: 'domain-1', endNodeId: 'bc-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenUserStoryHasDomain(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const story = findById(json.hierarchizedElements, 'story-1');
    expect(story.boundedContext).toBe('Paiement');
    expect(story.domain).toBe('Core Domain');
  }
}

export class IgnoresDomainConnectedDirectlyToUserStoryDriver
  implements IgnoresDomainConnectedDirectlyToUserStoryDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenADomainConnectedDirectlyToAUserStory(): void {
    const chain = buildFullChainUpToUserStory();
    this.boardReader.feedShapes([
      ...chain.shapes,
      { id: 'domain-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#CDF4D3', text: 'Core Domain' },
    ]);
    this.boardReader.feedConnectors([
      ...chain.connectors,
      { startNodeId: 'domain-1', endNodeId: 'story-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenUserStoryHasNoDomain(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const story = findById(json.hierarchizedElements, 'story-1');
    expect(story.domain).toBeUndefined();
  }
}

export class ExcludesActeursOperationnelsFromReleasesDriver
  implements ExcludesActeursOperationnelsFromReleasesDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: CommandResult<string>;

  givenAnActeursOperationnelsSectionAndAnElementInsideIt(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective', x: 100, y: 100, width: 200, height: 100 },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor', x: 100, y: 100, width: 200, height: 100 },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact', x: 100, y: 100, width: 200, height: 100 },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#EA580C', text: 'Action', x: 100, y: 100, width: 200, height: 100 },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#FACC15', text: 'A user story', x: 100, y: 100, width: 200, height: 100 },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
    ]);
    this.boardReader.feedSections([
      { name: 'Acteurs opérationnels', x: 0, y: 0, width: 500, height: 500 },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenNoReleaseIsAssigned(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ImpactMappingJson>();
    const story = findById(json.hierarchizedElements, 'story-1');
    expect(story.release).toBeUndefined();
  }
}

