import { describe, test } from 'vitest';
import {
  DetectsObjectiveByColorDriver,
  DetectsAllTypesByColorDriver,
  IgnoresUnknownColorDriver,
  IgnoresEmptyTextDriver,
  IgnoresNonRectangleShapesDriver,
  DetectsReleaseSectionDriver,
  IgnoresSectionsWithEmptyNameDriver,
  BuildsLinearHierarchyDriver,
  HandlesMultipleChildrenDriver,
  AssignsAndPropagatesReleaseDriver,
  ExcludesShapesWithoutConnectorDriver,
  RejectsElementWithMultipleParentsDriver,
  ExtractsTitleFromBoldTextDriver,
  ExtractsBodyFromNonBoldTextDriver,
  HasNoBodyWhenAllTextIsBoldDriver,
  IgnoresBackboneSectionDriver,
  WarnsWhenScenarioHasNoBodyDriver,
  WarnsWhenTitleIsTooLongDriver,
  NoWarningsWhenFormattingIsCorrectDriver,
  FullIntegrationDriver,
  ExtractsTestDriversFromScenarioTextDriver,
  StripsTestDriversBracketsFromBodyDriver,
  HasNoTestDriversWhenNoBracketsDriver,
  DetectsAttachmentConnectedToUserStoryDriver,
  IgnoresAttachmentConnectedToObjectiveDriver,
  DetectsBoundedContextConnectedToUserStoryDriver,
  IgnoresBoundedContextConnectedToObjectiveDriver,
  ExcludesVisionProduitFromReleasesDriver,
  ExcludesActeursOperationnelsFromReleasesDriver,
  ExtractsTestDriversWithCommaAndQuotesDriver,
  ExtractsTestDriversFromTopOfScenarioDriver,
  DetectsDomainConnectedToBcConnectedToUserStoryDriver,
  IgnoresDomainConnectedDirectlyToUserStoryDriver,
} from './analyzeImpactMap.useCaseDriver';

describe('AnalyzeImpactMap use case', () => {
  test('detects an objective shape by its blue color', () => {
    const driver = new DetectsObjectiveByColorDriver();
    driver.givenABoardWithAnObjectiveShape();
    driver.whenAnalyzingImpactMap();
    driver.thenOneObjectiveElementIsDetected();
  });

  test('detects all element types by their colors', () => {
    const driver = new DetectsAllTypesByColorDriver();
    driver.givenABoardWithOneShapePerType();
    driver.whenAnalyzingImpactMap();
    driver.thenAllTypesAreDetected();
  });

  test('ignores shapes with unknown color', () => {
    const driver = new IgnoresUnknownColorDriver();
    driver.givenABoardWithAnUnknownColorShape();
    driver.whenAnalyzingImpactMap();
    driver.thenNoElementIsDetected();
  });

  test('ignores shapes with empty text', () => {
    const driver = new IgnoresEmptyTextDriver();
    driver.givenABoardWithAnEmptyTextShape();
    driver.whenAnalyzingImpactMap();
    driver.thenNoElementIsDetected();
  });

  test('ignores non-rectangle shapes', () => {
    const driver = new IgnoresNonRectangleShapesDriver();
    driver.givenABoardWithNonRectangleShapes();
    driver.whenAnalyzingImpactMap();
    driver.thenNoElementIsDetected();
  });

  test('detects a release section with contained elements', () => {
    const driver = new DetectsReleaseSectionDriver();
    driver.givenASectionAndAnElementInsideIt();
    driver.whenAnalyzingImpactMap();
    driver.thenTheElementIsAssignedToTheRelease();
  });

  test('ignores sections with empty name', () => {
    const driver = new IgnoresSectionsWithEmptyNameDriver();
    driver.givenASectionWithEmptyNameAndAnElementInsideIt();
    driver.whenAnalyzingImpactMap();
    driver.thenNoReleaseIsAssigned();
  });

  test('builds a linear hierarchy from objective to impact', () => {
    const driver = new BuildsLinearHierarchyDriver();
    driver.givenALinearChainOfElements();
    driver.whenAnalyzingImpactMap();
    driver.thenALinearHierarchyIsProduced();
  });

  test('handles a rule with multiple scenario children', () => {
    const driver = new HandlesMultipleChildrenDriver();
    driver.givenARuleWithTwoScenarios();
    driver.whenAnalyzingImpactMap();
    driver.thenTheRuleHasTwoScenarioChildren();
  });

  test('assigns release to user story and propagates to children', () => {
    const driver = new AssignsAndPropagatesReleaseDriver();
    driver.givenAUserStoryWithReleaseAndChildren();
    driver.whenAnalyzingImpactMap();
    driver.thenReleaseIsPropagatedToChildren();
  });

  test('excludes shapes that have no connector', () => {
    const driver = new ExcludesShapesWithoutConnectorDriver();
    driver.givenElementsWithAndWithoutConnectors();
    driver.whenAnalyzingImpactMap();
    driver.thenOnlyConnectedElementsAreInTheHierarchy();
  });

  test('rejects an element with multiple parents', () => {
    const driver = new RejectsElementWithMultipleParentsDriver();
    driver.givenAnElementWithTwoParents();
    driver.whenAnalyzingImpactMap();
    driver.thenAnalysisFails();
  });

  test('extracts title from bold text', () => {
    const driver = new ExtractsTitleFromBoldTextDriver();
    driver.givenAShapeWithBoldTitleAndBody();
    driver.whenAnalyzingImpactMap();
    driver.thenTitleIsBoldText();
  });

  test('extracts body from non-bold text', () => {
    const driver = new ExtractsBodyFromNonBoldTextDriver();
    driver.givenAShapeWithBoldTitleAndBody();
    driver.whenAnalyzingImpactMap();
    driver.thenBodyIsNonBoldText();
  });

  test('has no body when all text is bold', () => {
    const driver = new HasNoBodyWhenAllTextIsBoldDriver();
    driver.givenAShapeWithAllBoldText();
    driver.whenAnalyzingImpactMap();
    driver.thenBodyIsUndefined();
  });

  test('ignores backbone section', () => {
    const driver = new IgnoresBackboneSectionDriver();
    driver.givenABackboneSectionAndAnElementInsideIt();
    driver.whenAnalyzingImpactMap();
    driver.thenNoReleaseIsAssigned();
  });

  test('warns when scenario has no body', () => {
    const driver = new WarnsWhenScenarioHasNoBodyDriver();
    driver.givenAScenarioWithAllTextInTitle();
    driver.whenAnalyzingImpactMap();
    driver.thenAWarningIsGeneratedForMissingBody();
  });

  test('warns when title is too long', () => {
    const driver = new WarnsWhenTitleIsTooLongDriver();
    driver.givenAnElementWithAVeryLongTitle();
    driver.whenAnalyzingImpactMap();
    driver.thenAWarningIsGeneratedForLongTitle();
  });

  test('no warnings when bold formatting is correct', () => {
    const driver = new NoWarningsWhenFormattingIsCorrectDriver();
    driver.givenElementsWithCorrectBoldFormatting();
    driver.whenAnalyzingImpactMap();
    driver.thenNoWarningsAreGenerated();
  });

  test('full integration: produces the expected JSON from complete board', () => {
    const driver = new FullIntegrationDriver();
    driver.givenTheCompleteImpactMappingBoard();
    driver.whenAnalyzingImpactMap();
    driver.thenTheExpectedJsonIsProduced();
  });

  test('extracts test drivers from scenario text brackets', () => {
    const driver = new ExtractsTestDriversFromScenarioTextDriver();
    driver.givenAScenarioWithTestDriversBrackets();
    driver.whenAnalyzingImpactMap();
    driver.thenTestDriversAreExtracted();
  });

  test('strips test drivers brackets from body and text', () => {
    const driver = new StripsTestDriversBracketsFromBodyDriver();
    driver.givenAScenarioWithTestDriversBrackets();
    driver.whenAnalyzingImpactMap();
    driver.thenBodyDoesNotContainBrackets();
  });

  test('has no test drivers when no brackets present', () => {
    const driver = new HasNoTestDriversWhenNoBracketsDriver();
    driver.givenAScenarioWithoutBrackets();
    driver.whenAnalyzingImpactMap();
    driver.thenTestDriversAreEmpty();
  });

  test('detects attachment connected to a user story', () => {
    const driver = new DetectsAttachmentConnectedToUserStoryDriver();
    driver.givenAnImageConnectedToAUserStory();
    driver.whenAnalyzingImpactMap();
    driver.thenUserStoryHasAttachmentNodeId();
  });

  test('ignores attachment connected to an objective', () => {
    const driver = new IgnoresAttachmentConnectedToObjectiveDriver();
    driver.givenAnImageConnectedToAnObjective();
    driver.whenAnalyzingImpactMap();
    driver.thenObjectiveHasNoAttachmentNodeIds();
  });

  test('detects bounded context connected to a user story', () => {
    const driver = new DetectsBoundedContextConnectedToUserStoryDriver();
    driver.givenABoundedContextConnectedToAUserStory();
    driver.whenAnalyzingImpactMap();
    driver.thenUserStoryHasBoundedContext();
  });

  test('ignores bounded context connected to an objective', () => {
    const driver = new IgnoresBoundedContextConnectedToObjectiveDriver();
    driver.givenABoundedContextConnectedToAnObjective();
    driver.whenAnalyzingImpactMap();
    driver.thenObjectiveHasNoBoundedContext();
  });

  test('excludes Vision produit section from releases', () => {
    const driver = new ExcludesVisionProduitFromReleasesDriver();
    driver.givenAVisionProduitSectionAndAnElementInsideIt();
    driver.whenAnalyzingImpactMap();
    driver.thenNoReleaseIsAssigned();
  });

  test('excludes Acteurs opérationnels section from releases', () => {
    const driver = new ExcludesActeursOperationnelsFromReleasesDriver();
    driver.givenAnActeursOperationnelsSectionAndAnElementInsideIt();
    driver.whenAnalyzingImpactMap();
    driver.thenNoReleaseIsAssigned();
  });

  test('extracts test drivers with comma separators and quotes', () => {
    const driver = new ExtractsTestDriversWithCommaAndQuotesDriver();
    driver.givenAScenarioWithCommaSeparatedQuotedDrivers();
    driver.whenAnalyzingImpactMap();
    driver.thenTestDriversAreExtractedCorrectly();
  });

  test('extracts test drivers from top of scenario text', () => {
    const driver = new ExtractsTestDriversFromTopOfScenarioDriver();
    driver.givenAScenarioWithTestDriversAtTop();
    driver.whenAnalyzingImpactMap();
    driver.thenTestDriversAreExtracted();
    driver.thenTitleDoesNotContainBrackets();
  });

  test('detects domain connected to a bounded context connected to a user story', () => {
    const driver = new DetectsDomainConnectedToBcConnectedToUserStoryDriver();
    driver.givenADomainConnectedToABcConnectedToAUserStory();
    driver.whenAnalyzingImpactMap();
    driver.thenUserStoryHasDomain();
  });

  test('ignores domain connected directly to a user story without bounded context', () => {
    const driver = new IgnoresDomainConnectedDirectlyToUserStoryDriver();
    driver.givenADomainConnectedDirectlyToAUserStory();
    driver.whenAnalyzingImpactMap();
    driver.thenUserStoryHasNoDomain();
  });

});
