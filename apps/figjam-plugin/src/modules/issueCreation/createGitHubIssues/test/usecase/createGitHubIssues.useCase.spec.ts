import { describe, test } from 'vitest';
import { CreatesIssuesFromHierarchizedElementsDriver, UpdatesExistingIssuesIdempotentlyDriver, ScenarioIssueHasTestDriversDriver, UploadsWireframeAndAddsToBodyDriver, UserStoryIssueBodyContainsBoundedContextDriver, DeletesRemovedScenarioOnResyncDriver, DeletesRemovedActionOnResyncDriver } from './createGitHubIssues.useCaseDriver';

describe('CreateGitHubIssues use case', () => {
  test('creates 7 issues for branch with user stories (RULE excluded)', async () => {
    const driver = new CreatesIssuesFromHierarchizedElementsDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    await driver.whenCreatingGitHubIssues();
    driver.thenSevenIssuesCreatedForBranchWithUserStories();
  });

  test('all issues have milestone MVP', async () => {
    const driver = new CreatesIssuesFromHierarchizedElementsDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    await driver.whenCreatingGitHubIssues();
    driver.thenAllIssuesHaveMilestoneMVP();
  });

  test('each issue has correct type, title and elementId', async () => {
    const driver = new CreatesIssuesFromHierarchizedElementsDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    await driver.whenCreatingGitHubIssues();
    driver.thenEachIssueHasCorrectTypeTitleAndElementId();
  });

  test('parent issues mirror the hierarchy', async () => {
    const driver = new CreatesIssuesFromHierarchizedElementsDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    await driver.whenCreatingGitHubIssues();
    driver.thenParentIssuesMirrorHierarchy();
  });

  test('no issues for branch without user stories', async () => {
    const driver = new CreatesIssuesFromHierarchizedElementsDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    await driver.whenCreatingGitHubIssues();
    driver.thenNoIssuesForBranchWithoutUserStories();
  });

  test('RULE is not created as a separate issue', async () => {
    const driver = new CreatesIssuesFromHierarchizedElementsDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    await driver.whenCreatingGitHubIssues();
    driver.thenRuleIsNotCreatedAsIssue();
  });

  test('issue body matches element body for non-user-story elements', async () => {
    const driver = new CreatesIssuesFromHierarchizedElementsDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    await driver.whenCreatingGitHubIssues();
    driver.thenIssueBodyMatchesElementBody();
  });

  test('user story body contains its own body and rules text', async () => {
    const driver = new CreatesIssuesFromHierarchizedElementsDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    await driver.whenCreatingGitHubIssues();
    driver.thenUserStoryBodyContainsRules();
  });

  test('scenarios are subissues of user story, not rule', async () => {
    const driver = new CreatesIssuesFromHierarchizedElementsDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    await driver.whenCreatingGitHubIssues();
    driver.thenScenariosAreSubissuesOfUserStory();
  });

  test('issue body is text after title with line breaks preserved', async () => {
    const driver = new CreatesIssuesFromHierarchizedElementsDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    await driver.whenCreatingGitHubIssues();
    driver.thenIssueBodyIsTextAfterTitleWithLineBreaksPreserved();
  });

  test('second submit updates existing issues instead of creating duplicates', async () => {
    const driver = new UpdatesExistingIssuesIdempotentlyDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    await driver.whenCreatingGitHubIssuesTwice();
    driver.thenSecondCallUpdatesInsteadOfCreating();
  });

  test('no issues are duplicated after second submit', async () => {
    const driver = new UpdatesExistingIssuesIdempotentlyDriver();
    driver.givenHierarchizedJsonWithTwoTrees();
    await driver.whenCreatingGitHubIssuesTwice();
    driver.thenNoIssuesAreDuplicated();
  });

  test('scenario issue carries test drivers from hierarchized element', async () => {
    const driver = new ScenarioIssueHasTestDriversDriver();
    driver.givenHierarchizedJsonWithScenarioTestDrivers();
    await driver.whenCreatingGitHubIssues();
    driver.thenScenarioIssueHasTestDrivers();
  });

  test('user story with attachment carries image data', async () => {
    const driver = new UploadsWireframeAndAddsToBodyDriver();
    driver.givenAUserStoryWithAttachment();
    await driver.whenCreatingGitHubIssues();
    driver.thenImageIsUploadedAndBodyContainsWireframe();
  });

  test('user story issue body contains bounded context', async () => {
    const driver = new UserStoryIssueBodyContainsBoundedContextDriver();
    driver.givenAUserStoryWithBoundedContext();
    await driver.whenCreatingGitHubIssues();
    driver.thenIssueBodyContainsBoundedContext();
  });

  test('re-syncing after removing a scenario deletes the removed scenario issue', async () => {
    const driver = new DeletesRemovedScenarioOnResyncDriver();
    driver.givenHierarchizedJsonWithUserStoryAndTwoScenarios();
    await driver.whenCreatingThenResyncingWithOneScenarioRemoved();
    driver.thenRemovedScenarioIsDeleted();
  });

  test('remaining scenario is still present after removing another', async () => {
    const driver = new DeletesRemovedScenarioOnResyncDriver();
    driver.givenHierarchizedJsonWithUserStoryAndTwoScenarios();
    await driver.whenCreatingThenResyncingWithOneScenarioRemoved();
    driver.thenRemainingScenarioIsStillPresent();
  });

  test('re-syncing after removing an action deletes the removed action issue', async () => {
    const driver = new DeletesRemovedActionOnResyncDriver();
    driver.givenHierarchizedJsonWithImpactAndTwoActions();
    await driver.whenCreatingThenResyncingWithOneActionRemoved();
    driver.thenRemovedActionIsDeleted();
  });

  test('remaining action is still present after removing another', async () => {
    const driver = new DeletesRemovedActionOnResyncDriver();
    driver.givenHierarchizedJsonWithImpactAndTwoActions();
    await driver.whenCreatingThenResyncingWithOneActionRemoved();
    driver.thenRemainingActionIsStillPresent();
  });

});
