import type {
  AnalyzeContextElementsContextReader,
  RawContextSection,
} from '../analyzeContextElements.contextReader';

export class AnalyzeContextElementsInMemoryContextReader
  implements AnalyzeContextElementsContextReader
{
  private sections: RawContextSection[] = [];

  feedSections(sections: RawContextSection[]): void {
    this.sections = sections;
  }

  readContextSections(): RawContextSection[] {
    return this.sections;
  }
}
