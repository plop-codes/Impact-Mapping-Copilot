import { AnalyzeImpactMapFigmaBoardReader } from './modules/boardAnalysis/analyzeImpactMap/analyzeImpactMap.figmaBoardReader';
import { AnalyzeImpactMapUseCase } from './modules/boardAnalysis/analyzeImpactMap/analyzeImpactMap.useCase';
import type { HierarchizedElementJson, ImpactMappingJson } from './modules/boardAnalysis/impactMapping';
import { COLOR_TO_TYPE, type ElementType } from './modules/boardAnalysis/element';
import { CreateBoardElementUseCase } from './modules/boardEdition/createBoardElement/createBoardElement.useCase';
import { FigmaBoardWriter } from './modules/boardEdition/createBoardElement/createBoardElement.figmaBoardWriter';
import type { ParentInfo } from './modules/boardEdition/createBoardElement/createBoardElement.boardElement';
import { AnalyzeContextElementsFigmaContextReader } from './modules/boardAnalysis/analyzeContextElements/analyzeContextElements.figmaContextReader';
import { AnalyzeContextElementsUseCase } from './modules/boardAnalysis/analyzeContextElements/analyzeContextElements.useCase';
import type { ContextElementsJson } from './modules/boardAnalysis/analyzeContextElements/contextElements';

figma.showUI(__html__, { width: 400, height: 500 });

const boardReader = new AnalyzeImpactMapFigmaBoardReader();
const analyzeImpactMap = new AnalyzeImpactMapUseCase(boardReader);
const contextReader = new AnalyzeContextElementsFigmaContextReader();
const analyzeContextElements = new AnalyzeContextElementsUseCase(contextReader);

type HierarchyContext = {
  rule: { id: string; title: string; body?: string };
  userStory?: { id: string; title: string; body?: string; boundedContext?: string; domain?: string };
  action?: { id: string; title: string };
  impact?: { id: string; title: string };
  actor?: { id: string; title: string };
  objective?: { id: string; title: string };
};

function buildHierarchyContext(
  ruleId: string,
  elements: HierarchizedElementJson[],
): HierarchyContext | { error: string } {
  const byId = new Map(elements.map((e) => [e.id, e]));
  const rule = byId.get(ruleId);
  if (!rule || rule.type !== 'RULE') {
    return { error: `Rule ${ruleId} introuvable ou de mauvais type` };
  }

  const result: HierarchyContext = {
    rule: { id: rule.id, title: rule.title, body: rule.body },
  };

  const us = rule.parentId ? byId.get(rule.parentId) : undefined;
  if (us && us.type === 'USER_STORY') {
    result.userStory = {
      id: us.id,
      title: us.title,
      body: us.body,
      boundedContext: us.boundedContext,
      domain: us.domain,
    };

    const action = us.parentId ? byId.get(us.parentId) : undefined;
    if (action && action.type === 'ACTION') {
      result.action = { id: action.id, title: action.title };

      const impact = action.parentId ? byId.get(action.parentId) : undefined;
      if (impact && impact.type === 'IMPACT') {
        result.impact = { id: impact.id, title: impact.title };

        const actor = impact.parentId ? byId.get(impact.parentId) : undefined;
        if (actor && actor.type === 'ACTOR') {
          result.actor = { id: actor.id, title: actor.title };

          const objective = actor.parentId ? byId.get(actor.parentId) : undefined;
          if (objective && objective.type === 'OBJECTIVE') {
            result.objective = { id: objective.id, title: objective.title };
          }
        }
      }
    }
  }

  return result;
}

function computeKnownIds(): Set<string> {
  const analyzeResult = analyzeImpactMap.execute();
  if (analyzeResult.isFailure()) {
    figma.notify(`Erreur: ${analyzeResult.getError()}`);
    return new Set();
  }
  const impactMappingJson = analyzeResult.getValue<ImpactMappingJson>();
  return new Set(impactMappingJson.hierarchizedElements.map((e) => e.id));
}

const initialResult = analyzeImpactMap.execute();

if (initialResult.isFailure()) {
  figma.notify(`Erreur: ${initialResult.getError()}`);
  figma.closePlugin();
} else {
  let knownIds = computeKnownIds();

  function sendSelectionUpdate(): void {
    const selectedElementIds = figma.currentPage.selection
      .map((node) => node.id)
      .filter((id) => knownIds.has(id));
    const selectedParent = getSelectedParent();
    figma.ui.postMessage({ type: 'SELECTION_CHANGED', selectedElementIds, selectedParent });
  }

  figma.on('selectionchange', sendSelectionUpdate);
  sendSelectionUpdate();

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
    if (msg.type === 'REQUEST_SCENARIO_CONTEXT') {
      const ruleId = msg.ruleId as string;
      const impactMapResult = analyzeImpactMap.execute();
      if (impactMapResult.isFailure()) {
        figma.ui.postMessage({ type: 'SCENARIO_CONTEXT', success: false, error: impactMapResult.getError() });
        return;
      }

      const elements = impactMapResult.getValue<ImpactMappingJson>().hierarchizedElements;
      const hierarchy = buildHierarchyContext(ruleId, elements);
      if ('error' in hierarchy) {
        figma.ui.postMessage({ type: 'SCENARIO_CONTEXT', success: false, error: hierarchy.error });
        return;
      }

      const contextResult = analyzeContextElements.execute();
      const glossary = contextResult.isSuccess()
        ? contextResult.getValue<ContextElementsJson>().glossary ?? []
        : [];

      figma.ui.postMessage({
        type: 'SCENARIO_CONTEXT',
        success: true,
        hierarchy,
        glossary,
      });
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
        figma.notify('Element cree');
        knownIds = computeKnownIds();
        figma.ui.postMessage({ type: 'ELEMENT_CREATED', success: true });
      }
    }
    if (msg.type === 'DONE') {
      figma.closePlugin();
    }
  };
}
