import type { CreateBoardElementBoardWriter, NewShape } from './createBoardElement.boardWriter';

function hexToRgb(hex: string): RGB {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}

export class FigmaBoardWriter implements CreateBoardElementBoardWriter {
  createShapeWithText(shape: NewShape): string {
    const node = figma.createShapeWithText();
    node.shapeType = 'SQUARE';
    node.fills = [{ type: 'SOLID', color: hexToRgb(shape.hexColor) }];
    node.x = shape.x;
    node.y = shape.y;
    node.resize(200, 100);
    return node.id;
  }

  createConnector(startNodeId: string, endNodeId: string): void {
    const connector = figma.createConnector();
    connector.connectorLineType = 'CURVED';
    connector.connectorStart = { endpointNodeId: startNodeId, magnet: 'BOTTOM' };
    connector.connectorEnd = { endpointNodeId: endNodeId, magnet: 'TOP' };
    connector.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
  }
}
