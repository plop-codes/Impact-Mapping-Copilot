import { describe, test } from 'vitest';
import {
  SyncsSelectedUserStoryWithChildrenDriver,
  SyncsSelectedRuleAsParentUserStoryDriver,
  SyncsSelectedScenarioOnlyDriver,
  ScenarioBodyFallbackFromTextDriver,
  ReturnsEmptyForActorWithoutDescendantUserStoryDriver,
} from './selectiveSync.useCaseDriver';

describe('Selective sync — IssuableElements.fromSelectedElements', () => {
  test('selecting a user story syncs it with its descendant scenarios', () => {
    const driver = new SyncsSelectedUserStoryWithChildrenDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    driver.whenSyncingSelectedUserStory();
    driver.thenUserStoryAndDescendantScenariosAreIssuable();
  });

  test('selecting a rule resolves to parent user story', () => {
    const driver = new SyncsSelectedRuleAsParentUserStoryDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    driver.whenSyncingSelectedRule();
    driver.thenParentUserStoryIsIssuable();
  });

  test('resolved user story body contains rules', () => {
    const driver = new SyncsSelectedRuleAsParentUserStoryDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    driver.whenSyncingSelectedRule();
    driver.thenUserStoryBodyContainsRules();
  });

  test('selecting a scenario syncs only that scenario', () => {
    const driver = new SyncsSelectedScenarioOnlyDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    driver.whenSyncingSelectedScenario();
    driver.thenOnlyScenarioIsIssuable();
  });

  test('scenario parent is resolved to user story', () => {
    const driver = new SyncsSelectedScenarioOnlyDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    driver.whenSyncingSelectedScenario();
    driver.thenScenarioParentIsUserStory();
  });

  test('scenario without body uses text as fallback for body', () => {
    const driver = new ScenarioBodyFallbackFromTextDriver();
    driver.givenHierarchizedJsonWithScenarioWithoutBody();
    driver.whenSyncingSelectedUserStory();
    driver.thenScenarioBodyIsFallbackFromText();
  });

  test('selecting an actor without descendant user story returns empty', () => {
    const driver = new ReturnsEmptyForActorWithoutDescendantUserStoryDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    driver.whenSyncingActorWithoutDescendantUserStory();
    driver.thenNoElementsAreIssuable();
  });
});
