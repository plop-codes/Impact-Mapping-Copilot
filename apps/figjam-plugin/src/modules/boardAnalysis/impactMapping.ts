import { Element, ElementType, HIERARCHY_ORDER, BOUNDED_CONTEXT_COLOR, DOMAIN_COLOR } from './element';
import { Release } from './release';
import type { RawShapeWithBounds, RawSectionData, RawConnector, RawAttachmentNode } from './analyzeImpactMap/analyzeImpactMap.boardReader';
import { CommandResult } from '../shared/result/commandResult';

export type HierarchizedElementJson = {
  id: string;
  type: ElementType;
  title: string;
  parentId?: string;
  release?: string;
  text?: string;
  body?: string;
  testDrivers?: string[];
  attachmentNodeIds?: string[];
  boundedContext?: string;
  domain?: string;
  childrenIds: string[];
};

export type ImpactMappingJson = {
  hierarchizedElements: HierarchizedElementJson[];
  warnings: string[];
  attachmentNodes?: { nodeId: string; name: string }[];
};

export class ImpactMapping {
  private readonly elements: Map<string, Element>;
  private readonly rootIds: string[];
  private readonly attachmentsByElementId: Map<string, string[]>;
  private readonly resolvedAttachmentNodes: RawAttachmentNode[];
  private readonly boundedContextByElementId: Map<string, string>;
  private readonly domainByElementId: Map<string, string>;

  private constructor(
    elements: Map<string, Element>,
    rootIds: string[],
    attachmentsByElementId: Map<string, string[]>,
    resolvedAttachmentNodes: RawAttachmentNode[],
    boundedContextByElementId: Map<string, string>,
    domainByElementId: Map<string, string>,
  ) {
    this.elements = elements;
    this.rootIds = rootIds;
    this.attachmentsByElementId = attachmentsByElementId;
    this.resolvedAttachmentNodes = resolvedAttachmentNodes;
    this.boundedContextByElementId = boundedContextByElementId;
    this.domainByElementId = domainByElementId;
  }

  static generateFromBoard(
    shapes: RawShapeWithBounds[],
    connectors: RawConnector[],
    rawSections: RawSectionData[],
    attachmentNodes: RawAttachmentNode[] = [],
  ): CommandResult<string> {
    const elements = this.extractElementsFromShapes(shapes);

    for (const section of rawSections) {
      const release = Release.identifyFromSection(section);
      if (release) release.assignToItems(elements, shapes);
    }

    const hierarchyResult = this.buildHierarchy(elements, connectors);
    if (hierarchyResult.isFailure()) return CommandResult.failure(hierarchyResult.getError());

    const { connectedElements, rootIds } = hierarchyResult.getValue<{
      connectedElements: Map<string, Element>;
      rootIds: string[];
    }>();

    this.propagateReleases(connectedElements, rootIds);

    const { attachmentsByElementId, resolvedAttachmentNodes } = this.resolveAttachments(
      connectedElements,
      connectors,
      attachmentNodes,
    );

    const { boundedContextByElementId, bcShapeIdByElementId } = this.resolveBoundedContexts(
      connectedElements,
      connectors,
      shapes,
    );

    const domainByBcShapeId = this.resolveDomains(connectors, shapes);
    const domainByElementId = new Map<string, string>();
    for (const [elementId, bcShapeId] of bcShapeIdByElementId) {
      const domain = domainByBcShapeId.get(bcShapeId);
      if (domain) domainByElementId.set(elementId, domain);
    }

    return CommandResult.success(new ImpactMapping(connectedElements, rootIds, attachmentsByElementId, resolvedAttachmentNodes, boundedContextByElementId, domainByElementId));
  }

  private static resolveAttachments(
    elements: Map<string, Element>,
    connectors: RawConnector[],
    attachmentNodes: RawAttachmentNode[],
  ): { attachmentsByElementId: Map<string, string[]>; resolvedAttachmentNodes: RawAttachmentNode[] } {
    const attachmentsByElementId = new Map<string, string[]>();
    const attachmentNodeIds = new Set(attachmentNodes.map((n) => n.nodeId));
    const usedAttachmentNodeIds = new Set<string>();

    const attachableTypes = new Set([ElementType.USER_STORY, ElementType.ACTION]);

    for (const connector of connectors) {
      const startIsElement = elements.has(connector.startNodeId);
      const endIsElement = elements.has(connector.endNodeId);
      const startIsAttachment = attachmentNodeIds.has(connector.startNodeId);
      const endIsAttachment = attachmentNodeIds.has(connector.endNodeId);

      let elementId: string | undefined;
      let attachmentNodeId: string | undefined;

      if (startIsElement && endIsAttachment) {
        elementId = connector.startNodeId;
        attachmentNodeId = connector.endNodeId;
      } else if (endIsElement && startIsAttachment) {
        elementId = connector.endNodeId;
        attachmentNodeId = connector.startNodeId;
      }

      if (!elementId || !attachmentNodeId) continue;

      const element = elements.get(elementId)!;
      if (!attachableTypes.has(element.type)) continue;
      const existing = attachmentsByElementId.get(elementId) ?? [];
      existing.push(attachmentNodeId);
      attachmentsByElementId.set(elementId, existing);
      usedAttachmentNodeIds.add(attachmentNodeId);
    }

    const resolvedAttachmentNodes = attachmentNodes.filter((n) => usedAttachmentNodeIds.has(n.nodeId));
    return { attachmentsByElementId, resolvedAttachmentNodes };
  }

  private static resolveBoundedContexts(
    elements: Map<string, Element>,
    connectors: RawConnector[],
    shapes: RawShapeWithBounds[],
  ): { boundedContextByElementId: Map<string, string>; bcShapeIdByElementId: Map<string, string> } {
    const validShapeTypes = new Set(['SQUARE', 'ROUNDED_RECTANGLE']);
    const bcShapes = new Map<string, string>();
    for (const shape of shapes) {
      if (
        shape.fillColor.toUpperCase() === BOUNDED_CONTEXT_COLOR &&
        validShapeTypes.has(shape.shapeType) &&
        shape.text.trim()
      ) {
        bcShapes.set(shape.id, shape.text.trim());
      }
    }

    const boundedContextByElementId = new Map<string, string>();
    const bcShapeIdByElementId = new Map<string, string>();
    const attachableTypes = new Set([ElementType.USER_STORY, ElementType.ACTION]);

    for (const connector of connectors) {
      const startIsElement = elements.has(connector.startNodeId);
      const endIsElement = elements.has(connector.endNodeId);
      const startIsBc = bcShapes.has(connector.startNodeId);
      const endIsBc = bcShapes.has(connector.endNodeId);

      let elementId: string | undefined;
      let bcShapeId: string | undefined;
      let bcTitle: string | undefined;

      if (startIsElement && endIsBc) {
        elementId = connector.startNodeId;
        bcShapeId = connector.endNodeId;
        bcTitle = bcShapes.get(connector.endNodeId);
      } else if (endIsElement && startIsBc) {
        elementId = connector.endNodeId;
        bcShapeId = connector.startNodeId;
        bcTitle = bcShapes.get(connector.startNodeId);
      }

      if (!elementId || !bcShapeId || !bcTitle) continue;

      const element = elements.get(elementId)!;
      if (!attachableTypes.has(element.type)) continue;
      if (boundedContextByElementId.has(elementId)) continue;

      boundedContextByElementId.set(elementId, bcTitle);
      bcShapeIdByElementId.set(elementId, bcShapeId);
    }

    return { boundedContextByElementId, bcShapeIdByElementId };
  }

  private static resolveDomains(
    connectors: RawConnector[],
    shapes: RawShapeWithBounds[],
  ): Map<string, string> {
    const validShapeTypes = new Set(['SQUARE', 'ROUNDED_RECTANGLE']);
    const domainShapes = new Map<string, string>();
    const bcShapeIds = new Set<string>();

    for (const shape of shapes) {
      const upperColor = shape.fillColor.toUpperCase();
      if (
        upperColor === DOMAIN_COLOR.toUpperCase() &&
        validShapeTypes.has(shape.shapeType) &&
        shape.text.trim()
      ) {
        domainShapes.set(shape.id, shape.text.trim());
      }
      if (upperColor === BOUNDED_CONTEXT_COLOR && validShapeTypes.has(shape.shapeType) && shape.text.trim()) {
        bcShapeIds.add(shape.id);
      }
    }

    const domainByBcShapeId = new Map<string, string>();

    for (const connector of connectors) {
      const startIsDomain = domainShapes.has(connector.startNodeId);
      const endIsDomain = domainShapes.has(connector.endNodeId);
      const startIsBc = bcShapeIds.has(connector.startNodeId);
      const endIsBc = bcShapeIds.has(connector.endNodeId);

      let bcShapeId: string | undefined;
      let domainTitle: string | undefined;

      if (startIsDomain && endIsBc) {
        bcShapeId = connector.endNodeId;
        domainTitle = domainShapes.get(connector.startNodeId);
      } else if (endIsDomain && startIsBc) {
        bcShapeId = connector.startNodeId;
        domainTitle = domainShapes.get(connector.endNodeId);
      }

      if (!bcShapeId || !domainTitle) continue;
      if (domainByBcShapeId.has(bcShapeId)) continue;

      domainByBcShapeId.set(bcShapeId, domainTitle);
    }

    return domainByBcShapeId;
  }

  private static extractElementsFromShapes(shapes: RawShapeWithBounds[]) {
    return shapes
      .map((shape) => Element.generateFromRawShape(shape))
      .filter((element): element is Element => element !== undefined);
  }

  private static buildHierarchy(
    elements: Element[],
    connectors: RawConnector[],
  ): CommandResult<string> {
    const elementMap = new Map(elements.map((el) => [el.id, el]));
    const connectedIds = new Set<string>();

    for (const connector of connectors) {
      const parent = elementMap.get(connector.startNodeId);
      const child = elementMap.get(connector.endNodeId);
      if (!parent || !child) continue;

      const error = this.assertOneParentMax(child);
      if (error) return error;

      child.parentId = parent.id;
      parent.childrenIds.push(child.id);
      connectedIds.add(parent.id);
      connectedIds.add(child.id);
    }

    const connectedElements = new Map(
      elements
        .filter((el) => connectedIds.has(el.id))
        .map((el) => [el.id, el]),
    );

    const rootIds = [...connectedElements.values()]
      .filter((el) => !el.parentId)
      .map((el) => el.id);

    const rootError = this.assertRootsAreObjective(connectedElements, rootIds);
    if (rootError) return rootError;

    const hierarchyError = this.assertParentChildHierarchy(connectedElements);
    if (hierarchyError) return hierarchyError;

    return CommandResult.success({ connectedElements, rootIds });
  }

  private static assertRootsAreObjective(
    elements: Map<string, Element>,
    rootIds: string[],
  ): CommandResult<string> | undefined {
    for (const id of rootIds) {
      const el = elements.get(id)!;
      if (el.type !== ElementType.OBJECTIVE) {
        return CommandResult.failure(
          `Root element "${el.title}" (id: ${el.id}) must be OBJECTIVE, got ${el.type}`,
        );
      }
    }
  }

  private static assertOneParentMax(
    child: Element,
  ): CommandResult<string> | undefined {
    if (child.parentId) {
      return CommandResult.failure(`Element "${child.title}" (id: ${child.id}, type: ${child.type}) has multiple parents`);
    }
  }

  private static assertParentChildHierarchy(
    elements: Map<string, Element>,
  ): CommandResult<string> | undefined {
    for (const el of elements.values()) {
      if (el.childrenIds.length === 0) continue;
      const parentLevel = HIERARCHY_ORDER.indexOf(el.type);
      for (const childId of el.childrenIds) {
        const child = elements.get(childId)!;
        const childLevel = HIERARCHY_ORDER.indexOf(child.type);
        if (childLevel - parentLevel !== 1) {
          return CommandResult.failure(
            `Element "${child.title}" (id: ${child.id}, type: ${child.type}) cannot be a child of "${el.title}" (id: ${el.id}, type: ${el.type})`,
          );
        }
      }
    }
  }

  private static propagateReleases(elements: Map<string, Element>, rootIds: string[]): void {
    const propagate = (elementId: string, parentRelease?: string): void => {
      const el = elements.get(elementId)!;
      if (!el.release && parentRelease) {
        el.release = parentRelease;
      }
      for (const childId of el.childrenIds) {
        propagate(childId, el.release);
      }
    };
    for (const rootId of rootIds) {
      propagate(rootId);
    }
  }

  private static readonly MAX_TITLE_LENGTH = 100;

  toJson(): ImpactMappingJson {
    const result: HierarchizedElementJson[] = [];
    const warnings: string[] = [];

    const collect = (elementId: string): void => {
      const el = this.elements.get(elementId)!;
      const json: HierarchizedElementJson = {
        id: el.id,
        type: el.type,
        title: el.title,
        childrenIds: el.childrenIds,
      };
      if (el.parentId) json.parentId = el.parentId;
      if (el.release) json.release = el.release;
      if (el.isScenario()) json.text = el.text;
      if (el.body) json.body = el.body;
      if (el.testDrivers.length > 0) json.testDrivers = el.testDrivers;
      const nodeIds = this.attachmentsByElementId.get(el.id);
      if (nodeIds && nodeIds.length > 0) json.attachmentNodeIds = nodeIds;
      const bc = this.boundedContextByElementId.get(el.id);
      if (bc) json.boundedContext = bc;
      const domain = this.domainByElementId.get(el.id);
      if (domain) json.domain = domain;
      result.push(json);

      if ((el.isScenario() || el.isRule()) && el.title.length > ImpactMapping.MAX_TITLE_LENGTH) {
        warnings.push(`Titre trop long (${el.title.length} car.) sur "${el.title.substring(0, 50)}…" (id: ${el.id}, type: ${el.type}) — vérifier le gras dans FigJam`);
      }
      if ((el.isScenario() || el.isRule()) && !el.body) {
        warnings.push(`${el.type} sans body "${el.title.substring(0, 50)}…" (id: ${el.id}) — vérifier le gras dans FigJam`);
      }

      for (const childId of el.childrenIds) {
        collect(childId);
      }
    };

    for (const rootId of this.rootIds) {
      collect(rootId);
    }

    const json: ImpactMappingJson = { hierarchizedElements: result, warnings };
    if (this.resolvedAttachmentNodes.length > 0) {
      json.attachmentNodes = this.resolvedAttachmentNodes;
    }
    return json;
  }
}
