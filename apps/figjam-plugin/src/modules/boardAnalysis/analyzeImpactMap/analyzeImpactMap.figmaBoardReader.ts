import type {
  AnalyzeImpactMapBoardReader,
  RawBoardData,
  RawShapeWithBounds,
  RawSectionData,
  RawConnector,
  RawAttachmentNode,
} from './analyzeImpactMap.boardReader';

export class AnalyzeImpactMapFigmaBoardReader
  implements AnalyzeImpactMapBoardReader
{
  readBoard(): RawBoardData {
    return {
      shapes: this.readShapes(),
      connectors: this.readConnectors(),
      sections: this.readSections(),
      attachmentNodes: this.readAttachmentNodes(),
    };
  }

  private readShapes(): RawShapeWithBounds[] {
    const nodes = figma.currentPage.findAll(
      (node) => node.type === 'SHAPE_WITH_TEXT',
    ) as ShapeWithTextNode[];

    const shapes: RawShapeWithBounds[] = [];

    for (const node of nodes) {
      const fill = this.extractFillColor(node);
      if (!fill) continue;

      shapes.push({
        id: node.id,
        shapeType: node.shapeType,
        fillColor: fill,
        text: node.text.characters,
        boldText: this.extractBoldText(node),
        x: node.absoluteTransform[0][2],
        y: node.absoluteTransform[1][2],
        width: node.width,
        height: node.height,
      });
    }

    return shapes;
  }

  private readConnectors(): RawConnector[] {
    const connectors = figma.currentPage.findAll(
      (node) => node.type === 'CONNECTOR',
    ) as ConnectorNode[];

    const result: RawConnector[] = [];

    for (const connector of connectors) {
      const startId = this.getEndpointNodeId(connector.connectorStart);
      const endId = this.getEndpointNodeId(connector.connectorEnd);
      if (!startId || !endId) continue;

      result.push({
        startNodeId: startId,
        endNodeId: endId,
      });
    }

    return result;
  }

  private readSections(): RawSectionData[] {
    const sections = figma.currentPage.findAll(
      (node) => node.type === 'SECTION',
    ) as SectionNode[];

    return sections.map((section) => ({
      name: section.name,
      x: section.x,
      y: section.y,
      width: section.width,
      height: section.height,
    }));
  }

  private extractFillColor(node: ShapeWithTextNode): string | undefined {
    const fills = node.fills;
    if (!Array.isArray(fills) || fills.length === 0) return undefined;
    const solidFill = fills.find(
      (f): f is SolidPaint => f.type === 'SOLID' && f.visible !== false,
    );
    if (!solidFill) return undefined;
    return this.rgbToHex(
      solidFill.color.r,
      solidFill.color.g,
      solidFill.color.b,
    );
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (v: number) =>
      Math.round(v * 255)
        .toString(16)
        .padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  private extractBoldText(node: ShapeWithTextNode): string | undefined {
    const segments = node.text.getStyledTextSegments(['fontName']);
    const boldParts = segments
      .filter((s) => s.fontName.style.includes('Bold'))
      .map((s) => s.characters);
    if (boldParts.length === 0) return undefined;
    return boldParts.join('');
  }

  private readAttachmentNodes(): RawAttachmentNode[] {
    const imageNodes = figma.currentPage.findAll(
      (node) => node.type === 'RECTANGLE' && this.hasImageFill(node as RectangleNode),
    );

    return imageNodes.map((node) => ({
      nodeId: node.id,
      name: node.name,
    }));
  }

  private hasImageFill(node: RectangleNode): boolean {
    const fills = node.fills;
    if (!Array.isArray(fills)) return false;
    return fills.some((f) => f.type === 'IMAGE' && f.visible !== false);
  }

  private getEndpointNodeId(
    endpoint: ConnectorEndpoint,
  ): string | undefined {
    if ('endpointNodeId' in endpoint) {
      return endpoint.endpointNodeId;
    }
    return undefined;
  }
}
