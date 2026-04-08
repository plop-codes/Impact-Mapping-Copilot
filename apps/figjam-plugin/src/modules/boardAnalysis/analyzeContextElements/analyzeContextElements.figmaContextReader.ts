import type {
  AnalyzeContextElementsContextReader,
  RawContextSection,
  RawTableData,
} from './analyzeContextElements.contextReader';

const CONTEXT_SECTION_NAMES = ['vision produit', 'acteurs opérationnels', 'glossaire'];

export class AnalyzeContextElementsFigmaContextReader
  implements AnalyzeContextElementsContextReader
{
  readContextSections(): RawContextSection[] {
    const sections = figma.currentPage.findAll(
      (node) => node.type === 'SECTION',
    ) as SectionNode[];

    return sections
      .filter((s) => CONTEXT_SECTION_NAMES.includes(s.name.trim().toLowerCase()))
      .map((section) => {
        const result: RawContextSection = { name: section.name };
        const textContent = this.readTextContent(section);
        if (textContent) result.textContent = textContent;
        const tableData = this.readTableData(section);
        if (tableData) result.tableData = tableData;
        return result;
      });
  }

  private readTextContent(section: SectionNode): string[] | undefined {
    const texts: string[] = [];
    for (const child of section.children) {
      if (child.type === 'STICKY') {
        const text = (child as StickyNode).text.characters.trim();
        if (text) texts.push(text);
      } else if (child.type === 'TEXT') {
        const text = (child as TextNode).characters.trim();
        if (text) texts.push(text);
      }
    }
    return texts.length > 0 ? texts : undefined;
  }

  private readTableData(section: SectionNode): RawTableData | undefined {
    const tableNode = section.children.find(
      (child) => child.type === 'TABLE',
    ) as TableNode | undefined;

    if (!tableNode) return undefined;
    if (tableNode.numRows < 2 || tableNode.numColumns < 2) return undefined;

    const headers: string[] = [];
    for (let col = 0; col < tableNode.numColumns; col++) {
      const cell = tableNode.cellAt(0, col);
      headers.push(cell.text.characters.trim());
    }

    const rows: string[][] = [];
    for (let row = 1; row < tableNode.numRows; row++) {
      const rowData: string[] = [];
      for (let col = 0; col < tableNode.numColumns; col++) {
        const cell = tableNode.cellAt(row, col);
        rowData.push(cell.text.characters.trim());
      }
      rows.push(rowData);
    }

    return { headers, rows };
  }
}
