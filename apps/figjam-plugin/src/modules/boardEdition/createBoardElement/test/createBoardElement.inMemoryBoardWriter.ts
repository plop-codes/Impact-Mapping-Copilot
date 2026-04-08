import type { CreateBoardElementBoardWriter, NewShape } from '../createBoardElement.boardWriter';

export type CreatedShape = NewShape & { id: string };
export type CreatedConnector = { startNodeId: string; endNodeId: string };

export class InMemoryBoardWriter implements CreateBoardElementBoardWriter {
  readonly shapes: CreatedShape[] = [];
  readonly connectors: CreatedConnector[] = [];
  private nextId = 1;

  createShapeWithText(shape: NewShape): string {
    const id = `node-${this.nextId++}`;
    this.shapes.push({ ...shape, id });
    return id;
  }

  createConnector(startNodeId: string, endNodeId: string): void {
    this.connectors.push({ startNodeId, endNodeId });
  }
}
