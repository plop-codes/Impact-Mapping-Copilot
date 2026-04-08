export type NewShape = {
  text: string;
  hexColor: string;
  x: number;
  y: number;
};

export type CreateBoardElementBoardWriter = {
  createShapeWithText(shape: NewShape): string;
  createConnector(startNodeId: string, endNodeId: string): void;
};
