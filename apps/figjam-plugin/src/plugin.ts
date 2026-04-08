import { AnalyzeImpactMapFigmaBoardReader } from './modules/boardAnalysis/analyzeImpactMap/analyzeImpactMap.figmaBoardReader';
import { AnalyzeImpactMapUseCase } from './modules/boardAnalysis/analyzeImpactMap/analyzeImpactMap.useCase';
import { AnalyzeContextElementsFigmaContextReader } from './modules/boardAnalysis/analyzeContextElements/analyzeContextElements.figmaContextReader';
import { AnalyzeContextElementsUseCase } from './modules/boardAnalysis/analyzeContextElements/analyzeContextElements.useCase';
import type { ImpactMappingJson } from './modules/boardAnalysis/impactMapping';
import type { ContextElementsJson } from './modules/boardAnalysis/analyzeContextElements/contextElements';
import { COLOR_TO_TYPE, type ElementType } from './modules/boardAnalysis/element';
import { CreateBoardElementUseCase } from './modules/boardEdition/createBoardElement/createBoardElement.useCase';
import { FigmaBoardWriter } from './modules/boardEdition/createBoardElement/createBoardElement.figmaBoardWriter';
import type { ParentInfo } from './modules/boardEdition/createBoardElement/createBoardElement.boardElement';

figma.showUI(__html__, { width: 400, height: 500 });

const boardReader = new AnalyzeImpactMapFigmaBoardReader();
const analyzeImpactMap = new AnalyzeImpactMapUseCase(boardReader);

const contextReader = new AnalyzeContextElementsFigmaContextReader();
const analyzeContextElements = new AnalyzeContextElementsUseCase(contextReader);

async function analyzeAndSendBoardData(): Promise<Set<string>> {
  const analyzeResult = analyzeImpactMap.execute();
  if (analyzeResult.isFailure()) {
    figma.notify(`Erreur: ${analyzeResult.getError()}`);
    return new Set();
  }

  const impactMappingJson = analyzeResult.getValue<ImpactMappingJson>();

  const attachments: Record<string, { name: string; bytes: number[] }[]> = {};
  const exportPromises: Promise<void>[] = [];

  for (const element of impactMappingJson.hierarchizedElements) {
    if (!element.attachmentNodeIds || element.attachmentNodeIds.length === 0) continue;

    const elementAttachments: { name: string; bytes: number[] }[] = [];
    attachments[element.id] = elementAttachments;

    for (const nodeId of element.attachmentNodeIds) {
      const node = figma.getNodeById(nodeId);
      if (!node || !('exportAsync' in node)) continue;

      const attachmentNode = impactMappingJson.attachmentNodes?.find((n) => n.nodeId === nodeId);
      const name = attachmentNode?.name ?? nodeId;

      exportPromises.push(
        (node as ExportMixin).exportAsync({
          format: 'PNG',
          constraint: { type: 'SCALE', value: 2 },
        }).then((bytes) => {
          elementAttachments.push({ name, bytes: Array.from(bytes) });
        }).catch(() => {
          // Export failed for this node, skip it
        }),
      );
    }
  }

  await Promise.all(exportPromises);

  for (const key of Object.keys(attachments)) {
    if (attachments[key].length === 0) delete attachments[key];
  }

  const contextResult = analyzeContextElements.execute();
  const contextJson = contextResult.isSuccess()
    ? contextResult.getValue<ContextElementsJson>()
    : {};

  figma.ui.postMessage({
    type: 'BOARD_DATA',
    elements: impactMappingJson.hierarchizedElements,
    warnings: impactMappingJson.warnings,
    attachments,
    productVision: contextJson.productVision,
    operationalActors: contextJson.operationalActors,
    glossary: contextJson.glossary,
  });

  return new Set(impactMappingJson.hierarchizedElements.map((e) => e.id));
}

const initialResult = analyzeImpactMap.execute();

if (initialResult.isFailure()) {
  figma.notify(`Erreur: ${initialResult.getError()}`);
  figma.closePlugin();
} else {
  let knownIds = new Set<string>();

  analyzeAndSendBoardData().then((ids) => {
    knownIds = ids;
  });

  function sendSelectionUpdate(): void {
    const selectedElementIds = figma.currentPage.selection
      .map((node) => node.id)
      .filter((id) => knownIds.has(id));
    const selectedParent = getSelectedParent();
    figma.ui.postMessage({ type: 'SELECTION_CHANGED', selectedElementIds, selectedParent });
  }

  figma.on('selectionchange', sendSelectionUpdate);
  sendSelectionUpdate();

  figma.clientStorage.getAsync('githubConfig').then((config) => {
    figma.ui.postMessage({ type: 'LOAD_CONFIG', config });
  });

  const boardWriter = new FigmaBoardWriter();
  const createBoardElement = new CreateBoardElementUseCase(boardWriter);

  function getSelectedParent(): (ParentInfo & { title: string }) | null {
    const selection = figma.currentPage.selection;
    if (selection.length !== 1) return null;

    const node = selection[0];
    if (node.type !== 'SHAPE_WITH_TEXT') return null;

    const shape = node as ShapeWithTextNode;
    const fills = shape.fills as readonly Paint[];
    const solidFill = fills.find((f): f is SolidPaint => f.type === 'SOLID');
    if (!solidFill) return null;

    const r = Math.round(solidFill.color.r * 255).toString(16).padStart(2, '0');
    const g = Math.round(solidFill.color.g * 255).toString(16).padStart(2, '0');
    const b = Math.round(solidFill.color.b * 255).toString(16).padStart(2, '0');
    const hex = `#${r}${g}${b}`.toUpperCase();

    const type = COLOR_TO_TYPE[hex];
    if (!type) return null;

    const bounds = shape.absoluteBoundingBox;
    if (!bounds) return null;

    const title = shape.text?.characters?.trim() ?? '';
    return { id: shape.id, type, x: bounds.x, y: bounds.y, height: bounds.height, title };
  }

  figma.ui.onmessage = async (msg) => {
    if (msg.type === 'REQUEST_BOARD_DATA') {
      const ids = await analyzeAndSendBoardData();
      if (ids.size > 0) knownIds = ids;
    }
    if (msg.type === 'SAVE_CONFIG') {
      figma.clientStorage.setAsync('githubConfig', msg.config);
    }
    if (msg.type === 'CREATE_BOARD_ELEMENT') {
      const parent = getSelectedParent();
      const viewport = figma.viewport.center;
      const result = createBoardElement.execute({
        elementType: msg.elementType as ElementType,
        parent,
        viewportCenter: { x: viewport.x, y: viewport.y },
      });

      if (result.isFailure()) {
        figma.notify(result.getError());
        figma.ui.postMessage({ type: 'ELEMENT_CREATED', success: false, error: result.getError() });
      } else {
        figma.notify('Élément créé');
        figma.ui.postMessage({ type: 'ELEMENT_CREATED', success: true });
      }
    }
    if (msg.type === 'CREATE_SCENARIOS') {
      const ruleId = msg.ruleId as string;
      const scenarios = msg.scenarios as Array<{ title: string; body?: string; testDrivers?: string[] }>;
      const ruleNode = figma.getNodeById(ruleId);

      if (!ruleNode || ruleNode.type !== 'SHAPE_WITH_TEXT') {
        figma.notify('Règle introuvable sur le board');
        return;
      }

      const ruleShape = ruleNode as ShapeWithTextNode;
      const ruleBounds = ruleShape.absoluteBoundingBox;
      if (!ruleBounds) return;

      const ruleType = COLOR_TO_TYPE[(() => {
        const fills = ruleShape.fills as readonly Paint[];
        const solidFill = fills.find((f): f is SolidPaint => f.type === 'SOLID');
        if (!solidFill) return '';
        const r = Math.round(solidFill.color.r * 255).toString(16).padStart(2, '0');
        const g = Math.round(solidFill.color.g * 255).toString(16).padStart(2, '0');
        const b = Math.round(solidFill.color.b * 255).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`.toUpperCase();
      })()];

      if (!ruleType) return;

      await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
      await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

      let offsetY = 0;
      for (const scenario of scenarios) {
        const parentInfo: ParentInfo = {
          id: ruleId,
          type: ruleType,
          x: ruleBounds.x,
          y: ruleBounds.y + offsetY,
          height: ruleBounds.height,
        };

        const result = createBoardElement.execute({
          elementType: 'SCENARIO' as ElementType,
          parent: parentInfo,
          viewportCenter: { x: 0, y: 0 },
        });

        if (result.isSuccess()) {
          const nodeId = result.getValue<string>();
          const node = figma.getNodeById(nodeId);
          if (node && node.type === 'SHAPE_WITH_TEXT') {
            const shapeNode = node as ShapeWithTextNode;
            const textNode = shapeNode.text;
            const bodyPart = scenario.body ? `\n\n${scenario.body}` : '';
            const driversSuffix = scenario.testDrivers?.length
              ? `\n\n[${scenario.testDrivers.join(', ')}]`
              : '';
            const fullText = `${scenario.title}${bodyPart}${driversSuffix}`;
            textNode.characters = fullText;
            textNode.setRangeFontName(0, scenario.title.length, { family: 'Inter', style: 'Bold' });
            shapeNode.resize(250, 120);
          }
        }

        offsetY += 220;
      }

      figma.notify(`${scenarios.length} scénarios créés`);
    }
    if (msg.type === 'DONE') {
      figma.closePlugin();
    }
  };
}
