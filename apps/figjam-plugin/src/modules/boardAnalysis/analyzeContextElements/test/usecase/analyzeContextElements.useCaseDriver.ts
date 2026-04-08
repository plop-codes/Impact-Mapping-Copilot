import { expect } from 'vitest';
import { AnalyzeContextElementsUseCase } from '../../analyzeContextElements.useCase';
import { AnalyzeContextElementsInMemoryContextReader } from '../analyzeContextElements.inMemoryContextReader';
import { CommandResult } from '../../../../shared/result/commandResult';
import type { ContextElementsJson } from '../../contextElements';
import type {
  ExtractsProductVisionFromSectionDsl,
  ExtractsOperationalActorsFromSectionDsl,
  ExtractsGlossaryFromTableDsl,
  ExtractsGlossaryWithMultipleBoundedContextsDsl,
  IgnoresEmptyGlossaryTermsDsl,
  ReturnsNoGlossaryWhenNoTableInSectionDsl,
} from '../analyzeContextElements.dsl';

export class ExtractsProductVisionFromSectionDriver
  implements ExtractsProductVisionFromSectionDsl
{
  private readonly contextReader = new AnalyzeContextElementsInMemoryContextReader();
  private readonly useCase = new AnalyzeContextElementsUseCase(this.contextReader);
  private result!: CommandResult<string>;

  givenAProductVisionSectionWithStickyNotes(): void {
    this.contextReader.feedSections([
      { name: 'Vision produit', textContent: ['Notre vision est...', 'Un monde meilleur'] },
    ]);
  }

  whenAnalyzingContextElements(): void {
    this.result = this.useCase.execute();
  }

  thenProductVisionContainsStickyNoteTexts(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ContextElementsJson>();
    expect(json.productVision).toEqual(['Notre vision est...', 'Un monde meilleur']);
  }
}

export class ExtractsOperationalActorsFromSectionDriver
  implements ExtractsOperationalActorsFromSectionDsl
{
  private readonly contextReader = new AnalyzeContextElementsInMemoryContextReader();
  private readonly useCase = new AnalyzeContextElementsUseCase(this.contextReader);
  private result!: CommandResult<string>;

  givenAnOperationalActorsSectionWithStickyNotes(): void {
    this.contextReader.feedSections([
      { name: 'Acteurs opérationnels', textContent: ['Product Owner', 'Développeur'] },
    ]);
  }

  whenAnalyzingContextElements(): void {
    this.result = this.useCase.execute();
  }

  thenOperationalActorsContainsStickyNoteTexts(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ContextElementsJson>();
    expect(json.operationalActors).toEqual(['Product Owner', 'Développeur']);
  }
}

export class ExtractsGlossaryFromTableDriver
  implements ExtractsGlossaryFromTableDsl
{
  private readonly contextReader = new AnalyzeContextElementsInMemoryContextReader();
  private readonly useCase = new AnalyzeContextElementsUseCase(this.contextReader);
  private result!: CommandResult<string>;

  givenAGlossarySectionWithATable(): void {
    this.contextReader.feedSections([
      {
        name: 'Glossaire',
        tableData: {
          headers: ['Terme', 'Paiement'],
          rows: [['Facture', 'Document comptable']],
        },
      },
    ]);
  }

  whenAnalyzingContextElements(): void {
    this.result = this.useCase.execute();
  }

  thenGlossaryContainsEntries(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ContextElementsJson>();
    expect(json.glossary).toEqual([
      { term: 'Facture', definitions: { Paiement: 'Document comptable' } },
    ]);
  }
}

export class ExtractsGlossaryWithMultipleBoundedContextsDriver
  implements ExtractsGlossaryWithMultipleBoundedContextsDsl
{
  private readonly contextReader = new AnalyzeContextElementsInMemoryContextReader();
  private readonly useCase = new AnalyzeContextElementsUseCase(this.contextReader);
  private result!: CommandResult<string>;

  givenAGlossarySectionWithMultipleBoundedContexts(): void {
    this.contextReader.feedSections([
      {
        name: 'Glossaire',
        tableData: {
          headers: ['Terme', 'Paiement', 'Livraison'],
          rows: [['Commande', 'Intention achat', 'Colis à expédier']],
        },
      },
    ]);
  }

  whenAnalyzingContextElements(): void {
    this.result = this.useCase.execute();
  }

  thenGlossaryContainsDefinitionsPerBoundedContext(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ContextElementsJson>();
    expect(json.glossary).toEqual([
      {
        term: 'Commande',
        definitions: {
          Paiement: 'Intention achat',
          Livraison: 'Colis à expédier',
        },
      },
    ]);
  }
}

export class IgnoresEmptyGlossaryTermsDriver
  implements IgnoresEmptyGlossaryTermsDsl
{
  private readonly contextReader = new AnalyzeContextElementsInMemoryContextReader();
  private readonly useCase = new AnalyzeContextElementsUseCase(this.contextReader);
  private result!: CommandResult<string>;

  givenAGlossarySectionWithEmptyTerms(): void {
    this.contextReader.feedSections([
      {
        name: 'Glossaire',
        tableData: {
          headers: ['Terme', 'Paiement'],
          rows: [
            ['Facture', 'Document comptable'],
            ['', 'Pas de terme'],
            ['  ', 'Espaces seulement'],
          ],
        },
      },
    ]);
  }

  whenAnalyzingContextElements(): void {
    this.result = this.useCase.execute();
  }

  thenEmptyTermsAreSkipped(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ContextElementsJson>();
    expect(json.glossary).toEqual([
      { term: 'Facture', definitions: { Paiement: 'Document comptable' } },
    ]);
  }
}

export class ReturnsNoGlossaryWhenNoTableInSectionDriver
  implements ReturnsNoGlossaryWhenNoTableInSectionDsl
{
  private readonly contextReader = new AnalyzeContextElementsInMemoryContextReader();
  private readonly useCase = new AnalyzeContextElementsUseCase(this.contextReader);
  private result!: CommandResult<string>;

  givenAGlossarySectionWithoutTable(): void {
    this.contextReader.feedSections([
      { name: 'Glossaire', textContent: ['Some text'] },
    ]);
  }

  whenAnalyzingContextElements(): void {
    this.result = this.useCase.execute();
  }

  thenGlossaryIsUndefined(): void {
    expect(this.result.isSuccess()).toBe(true);
    const json = this.result.getValue<ContextElementsJson>();
    expect(json.glossary).toBeUndefined();
  }
}
