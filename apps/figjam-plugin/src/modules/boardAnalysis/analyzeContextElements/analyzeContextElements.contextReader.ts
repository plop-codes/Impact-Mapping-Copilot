export type RawTableData = { headers: string[]; rows: string[][] };

export type RawContextSection = {
  name: string;
  tableData?: RawTableData;
};

export interface AnalyzeContextElementsContextReader {
  readContextSections(): RawContextSection[];
}
