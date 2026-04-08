export interface SyncsSelectedUserStoryWithChildrenDsl {
  givenHierarchizedJsonWithTwoTrees(): void;
  whenSyncingSelectedUserStory(): void;
  thenUserStoryAndDescendantScenariosAreIssuable(): void;
}

export interface SyncsSelectedRuleAsParentUserStoryDsl {
  givenHierarchizedJsonWithTwoTrees(): void;
  whenSyncingSelectedRule(): void;
  thenParentUserStoryIsIssuable(): void;
  thenUserStoryBodyContainsRules(): void;
}

export interface SyncsSelectedScenarioOnlyDsl {
  givenHierarchizedJsonWithTwoTrees(): void;
  whenSyncingSelectedScenario(): void;
  thenOnlyScenarioIsIssuable(): void;
  thenScenarioParentIsUserStory(): void;
}

export interface ScenarioBodyFallbackFromTextDsl {
  givenHierarchizedJsonWithScenarioWithoutBody(): void;
  whenSyncingSelectedUserStory(): void;
  thenScenarioBodyIsFallbackFromText(): void;
}

export interface ReturnsEmptyForActorWithoutDescendantUserStoryDsl {
  givenHierarchizedJsonWithTwoTrees(): void;
  whenSyncingActorWithoutDescendantUserStory(): void;
  thenNoElementsAreIssuable(): void;
}
