import type {
  AnalyzeImpactMapBoardReader,
  RawBoardData,
  RawShapeWithBounds,
  RawSectionData,
  RawConnector,
  RawAttachmentNode,
} from '../analyzeImpactMap.boardReader';

export class AnalyzeImpactMapInMemoryBoardReader
  implements AnalyzeImpactMapBoardReader
{
  private shapes: RawShapeWithBounds[] = [];
  private connectors: RawConnector[] = [];
  private sections: RawSectionData[] = [];
  private attachmentNodes: RawAttachmentNode[] = [];

  feedShapes(shapes: RawShapeWithBounds[]): void {
    this.shapes = shapes;
  }

  feedConnectors(connectors: RawConnector[]): void {
    this.connectors = connectors;
  }

  feedSections(sections: RawSectionData[]): void {
    this.sections = sections;
  }

  feedAttachmentNodes(attachmentNodes: RawAttachmentNode[]): void {
    this.attachmentNodes = attachmentNodes;
  }

  readBoard(): RawBoardData {
    return {
      shapes: this.shapes,
      connectors: this.connectors,
      sections: this.sections,
      attachmentNodes: this.attachmentNodes,
    };
  }
}
