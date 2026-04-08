export interface DetectsObjectiveByColorDsl {
  givenABoardWithAnObjectiveShape(): void;
  whenAnalyzingImpactMap(): void;
  thenOneObjectiveElementIsDetected(): void;
}

export interface DetectsAllTypesByColorDsl {
  givenABoardWithOneShapePerType(): void;
  whenAnalyzingImpactMap(): void;
  thenAllTypesAreDetected(): void;
}

export interface IgnoresUnknownColorDsl {
  givenABoardWithAnUnknownColorShape(): void;
  whenAnalyzingImpactMap(): void;
  thenNoElementIsDetected(): void;
}

export interface IgnoresEmptyTextDsl {
  givenABoardWithAnEmptyTextShape(): void;
  whenAnalyzingImpactMap(): void;
  thenNoElementIsDetected(): void;
}

export interface IgnoresNonRectangleShapesDsl {
  givenABoardWithNonRectangleShapes(): void;
  whenAnalyzingImpactMap(): void;
  thenNoElementIsDetected(): void;
}

export interface DetectsReleaseSectionDsl {
  givenASectionAndAnElementInsideIt(): void;
  whenAnalyzingImpactMap(): void;
  thenTheElementIsAssignedToTheRelease(): void;
}

export interface IgnoresSectionsWithEmptyNameDsl {
  givenASectionWithEmptyNameAndAnElementInsideIt(): void;
  whenAnalyzingImpactMap(): void;
  thenNoReleaseIsAssigned(): void;
}

export interface BuildsLinearHierarchyDsl {
  givenALinearChainOfElements(): void;
  whenAnalyzingImpactMap(): void;
  thenALinearHierarchyIsProduced(): void;
}

export interface HandlesMultipleChildrenDsl {
  givenARuleWithTwoScenarios(): void;
  whenAnalyzingImpactMap(): void;
  thenTheRuleHasTwoScenarioChildren(): void;
}

export interface AssignsAndPropagatesReleaseDsl {
  givenAUserStoryWithReleaseAndChildren(): void;
  whenAnalyzingImpactMap(): void;
  thenReleaseIsPropagatedToChildren(): void;
}

export interface ExcludesShapesWithoutConnectorDsl {
  givenElementsWithAndWithoutConnectors(): void;
  whenAnalyzingImpactMap(): void;
  thenOnlyConnectedElementsAreInTheHierarchy(): void;
}

export interface RejectsElementWithMultipleParentsDsl {
  givenAnElementWithTwoParents(): void;
  whenAnalyzingImpactMap(): void;
  thenAnalysisFails(): void;
}

export interface ExtractsTitleFromBoldTextDsl {
  givenAShapeWithBoldTitleAndBody(): void;
  whenAnalyzingImpactMap(): void;
  thenTitleIsBoldText(): void;
}

export interface ExtractsBodyFromNonBoldTextDsl {
  givenAShapeWithBoldTitleAndBody(): void;
  whenAnalyzingImpactMap(): void;
  thenBodyIsNonBoldText(): void;
}

export interface HasNoBodyWhenAllTextIsBoldDsl {
  givenAShapeWithAllBoldText(): void;
  whenAnalyzingImpactMap(): void;
  thenBodyIsUndefined(): void;
}

export interface IgnoresBackboneSectionDsl {
  givenABackboneSectionAndAnElementInsideIt(): void;
  whenAnalyzingImpactMap(): void;
  thenNoReleaseIsAssigned(): void;
}

export interface WarnsWhenScenarioHasNoBodyDsl {
  givenAScenarioWithAllTextInTitle(): void;
  whenAnalyzingImpactMap(): void;
  thenAWarningIsGeneratedForMissingBody(): void;
}

export interface WarnsWhenTitleIsTooLongDsl {
  givenAnElementWithAVeryLongTitle(): void;
  whenAnalyzingImpactMap(): void;
  thenAWarningIsGeneratedForLongTitle(): void;
}

export interface NoWarningsWhenFormattingIsCorrectDsl {
  givenElementsWithCorrectBoldFormatting(): void;
  whenAnalyzingImpactMap(): void;
  thenNoWarningsAreGenerated(): void;
}

export interface FullIntegrationDsl {
  givenTheCompleteImpactMappingBoard(): void;
  whenAnalyzingImpactMap(): void;
  thenTheExpectedJsonIsProduced(): void;
}

export interface ExtractsTestDriversFromScenarioTextDsl {
  givenAScenarioWithTestDriversBrackets(): void;
  whenAnalyzingImpactMap(): void;
  thenTestDriversAreExtracted(): void;
}

export interface StripsTestDriversBracketsFromBodyDsl {
  givenAScenarioWithTestDriversBrackets(): void;
  whenAnalyzingImpactMap(): void;
  thenBodyDoesNotContainBrackets(): void;
}

export interface HasNoTestDriversWhenNoBracketsDsl {
  givenAScenarioWithoutBrackets(): void;
  whenAnalyzingImpactMap(): void;
  thenTestDriversAreEmpty(): void;
}

export interface DetectsAttachmentConnectedToUserStoryDsl {
  givenAnImageConnectedToAUserStory(): void;
  whenAnalyzingImpactMap(): void;
  thenUserStoryHasAttachmentNodeId(): void;
}

export interface IgnoresAttachmentConnectedToObjectiveDsl {
  givenAnImageConnectedToAnObjective(): void;
  whenAnalyzingImpactMap(): void;
  thenObjectiveHasNoAttachmentNodeIds(): void;
}

export interface DetectsBoundedContextConnectedToUserStoryDsl {
  givenABoundedContextConnectedToAUserStory(): void;
  whenAnalyzingImpactMap(): void;
  thenUserStoryHasBoundedContext(): void;
}

export interface IgnoresBoundedContextConnectedToObjectiveDsl {
  givenABoundedContextConnectedToAnObjective(): void;
  whenAnalyzingImpactMap(): void;
  thenObjectiveHasNoBoundedContext(): void;
}

export interface ExcludesVisionProduitFromReleasesDsl {
  givenAVisionProduitSectionAndAnElementInsideIt(): void;
  whenAnalyzingImpactMap(): void;
  thenNoReleaseIsAssigned(): void;
}

export interface ExcludesActeursOperationnelsFromReleasesDsl {
  givenAnActeursOperationnelsSectionAndAnElementInsideIt(): void;
  whenAnalyzingImpactMap(): void;
  thenNoReleaseIsAssigned(): void;
}

export interface ExtractsTestDriversFromTopOfScenarioDsl {
  givenAScenarioWithTestDriversAtTop(): void;
  whenAnalyzingImpactMap(): void;
  thenTestDriversAreExtracted(): void;
  thenTitleDoesNotContainBrackets(): void;
}

export interface ExtractsTestDriversWithCommaAndQuotesDsl {
  givenAScenarioWithCommaSeparatedQuotedDrivers(): void;
  whenAnalyzingImpactMap(): void;
  thenTestDriversAreExtractedCorrectly(): void;
}

export interface DetectsDomainConnectedToBcConnectedToUserStoryDsl {
  givenADomainConnectedToABcConnectedToAUserStory(): void;
  whenAnalyzingImpactMap(): void;
  thenUserStoryHasDomain(): void;
}

export interface IgnoresDomainConnectedDirectlyToUserStoryDsl {
  givenADomainConnectedDirectlyToAUserStory(): void;
  whenAnalyzingImpactMap(): void;
  thenUserStoryHasNoDomain(): void;
}

