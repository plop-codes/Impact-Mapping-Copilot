export interface ExtractsGlossaryFromTableDsl {
  givenAGlossarySectionWithATable(): void;
  whenAnalyzingContextElements(): void;
  thenGlossaryContainsEntries(): void;
}

export interface ExtractsGlossaryWithMultipleBoundedContextsDsl {
  givenAGlossarySectionWithMultipleBoundedContexts(): void;
  whenAnalyzingContextElements(): void;
  thenGlossaryContainsDefinitionsPerBoundedContext(): void;
}

export interface IgnoresEmptyGlossaryTermsDsl {
  givenAGlossarySectionWithEmptyTerms(): void;
  whenAnalyzingContextElements(): void;
  thenEmptyTermsAreSkipped(): void;
}

export interface ReturnsNoGlossaryWhenNoTableInSectionDsl {
  givenAGlossarySectionWithoutTable(): void;
  whenAnalyzingContextElements(): void;
  thenGlossaryIsUndefined(): void;
}
