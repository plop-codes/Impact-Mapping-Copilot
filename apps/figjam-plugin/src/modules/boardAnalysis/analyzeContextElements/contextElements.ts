import type { RawContextSection, RawTableData } from './analyzeContextElements.contextReader';

export type GlossaryEntry = {
  term: string;
  definitions: Record<string, string>;
};

export type ContextElementsJson = {
  glossary?: GlossaryEntry[];
};

export class ContextElements {
  private constructor(private readonly glossary?: GlossaryEntry[]) {}

  static fromRawSections(sections: RawContextSection[]): ContextElements {
    return new ContextElements(this.extractGlossary(sections));
  }

  toJson(): ContextElementsJson {
    const result: ContextElementsJson = {};
    if (this.glossary?.length) result.glossary = this.glossary;
    return result;
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
