import { describe, test } from 'vitest';
import {
  ExtractsProductVisionFromSectionDriver,
  ExtractsOperationalActorsFromSectionDriver,
  ExtractsGlossaryFromTableDriver,
  ExtractsGlossaryWithMultipleBoundedContextsDriver,
  IgnoresEmptyGlossaryTermsDriver,
  ReturnsNoGlossaryWhenNoTableInSectionDriver,
} from './analyzeContextElements.useCaseDriver';

describe('AnalyzeContextElements use case', () => {
  test('extracts product vision from section', () => {
    const driver = new ExtractsProductVisionFromSectionDriver();
    driver.givenAProductVisionSectionWithStickyNotes();
    driver.whenAnalyzingContextElements();
    driver.thenProductVisionContainsStickyNoteTexts();
  });

  test('extracts operational actors from section', () => {
    const driver = new ExtractsOperationalActorsFromSectionDriver();
    driver.givenAnOperationalActorsSectionWithStickyNotes();
    driver.whenAnalyzingContextElements();
    driver.thenOperationalActorsContainsStickyNoteTexts();
  });

  test('extracts glossary from table', () => {
    const driver = new ExtractsGlossaryFromTableDriver();
    driver.givenAGlossarySectionWithATable();
    driver.whenAnalyzingContextElements();
    driver.thenGlossaryContainsEntries();
  });

  test('extracts glossary with multiple bounded contexts', () => {
    const driver = new ExtractsGlossaryWithMultipleBoundedContextsDriver();
    driver.givenAGlossarySectionWithMultipleBoundedContexts();
    driver.whenAnalyzingContextElements();
    driver.thenGlossaryContainsDefinitionsPerBoundedContext();
  });

  test('ignores empty glossary terms', () => {
    const driver = new IgnoresEmptyGlossaryTermsDriver();
    driver.givenAGlossarySectionWithEmptyTerms();
    driver.whenAnalyzingContextElements();
    driver.thenEmptyTermsAreSkipped();
  });

  test('returns no glossary when no table in section', () => {
    const driver = new ReturnsNoGlossaryWhenNoTableInSectionDriver();
    driver.givenAGlossarySectionWithoutTable();
    driver.whenAnalyzingContextElements();
    driver.thenGlossaryIsUndefined();
  });
});
