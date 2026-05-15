import type {
  AnalyzeContextElementsContextReader,
  RawContextSection,
  RawTableData,
} from './analyzeContextElements.contextReader';

export class AnalyzeContextElementsFigmaContextReader
  implements AnalyzeContextElementsContextReader
{
  readContextSections(): RawContextSection[] {
    const sections = figma.currentPage.findAll(
      (node) => node.type === 'SECTION',
    ) as SectionNode[];

    return sections
      .filter((s) => s.name.trim().toLowerCase() === 'glossaire')
      .map((section) => {
        const result: RawContextSection = { name: section.name };
        const tableData = this.readTableData(section);
        if (tableData) result.tableData = tableData;
        return result;
      });
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
