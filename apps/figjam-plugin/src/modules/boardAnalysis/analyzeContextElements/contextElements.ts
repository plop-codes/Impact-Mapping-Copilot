import type { RawContextSection, RawTableData } from './analyzeContextElements.contextReader';

export type GlossaryEntry = {
  term: string;
  definitions: Record<string, string>;
};

export type ContextElementsJson = {
  productVision?: string[];
  operationalActors?: string[];
  glossary?: GlossaryEntry[];
};

export class ContextElements {
  private constructor(
    private readonly productVision?: string[],
    private readonly operationalActors?: string[],
    private readonly glossary?: GlossaryEntry[],
  ) {}

  static fromRawSections(sections: RawContextSection[]): ContextElements {
    const productVision = this.extractTextContent(sections, 'vision produit');
    const operationalActors = this.extractTextContent(sections, 'acteurs opérationnels');
    const glossary = this.extractGlossary(sections);

    return new ContextElements(productVision, operationalActors, glossary);
  }

  toJson(): ContextElementsJson {
    const result: ContextElementsJson = {};
    if (this.productVision?.length) result.productVision = this.productVision;
    if (this.operationalActors?.length) result.operationalActors = this.operationalActors;
    if (this.glossary?.length) result.glossary = this.glossary;
    return result;
  }

  private static extractTextContent(sections: RawContextSection[], sectionName: string): string[] | undefined {
    const section = sections.find(
      (s) => s.name.trim().toLowerCase() === sectionName,
    );
    return section?.textContent?.length ? section.textContent : undefined;
  }

  private static extractGlossary(sections: RawContextSection[]): GlossaryEntry[] | undefined {
    const section = sections.find(
      (s) => s.name.trim().toLowerCase() === 'glossaire',
    );
    if (!section?.tableData) return undefined;

    const entries = this.parseGlossaryTable(section.tableData);
    return entries.length > 0 ? entries : undefined;
  }

  private static parseGlossaryTable(tableData: RawTableData): GlossaryEntry[] {
    const bcNames = tableData.headers.slice(1);
    const entries: GlossaryEntry[] = [];

    for (const row of tableData.rows) {
      const term = row[0]?.trim();
      if (!term) continue;

      const definitions: Record<string, string> = {};
      for (let i = 0; i < bcNames.length; i++) {
        const def = row[i + 1]?.trim();
        if (def) {
          definitions[bcNames[i]] = def;
        }
      }

      entries.push({ term, definitions });
    }

    return entries;
  }
}
