export type RawConnector = {
  startNodeId: string;
  endNodeId: string;
};

export type RawShapeWithBounds = {
  id: string;
  shapeType: string;
  fillColor: string;
  text: string;
  boldText?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type RawSectionData = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RawAttachmentNode = {
  nodeId: string;
  name: string;
};

export type RawBoardData = {
  shapes: RawShapeWithBounds[];
  connectors: RawConnector[];
  sections: RawSectionData[];
  attachmentNodes: RawAttachmentNode[];
};

export interface AnalyzeImpactMapBoardReader {
  readBoard(): RawBoardData;
}
