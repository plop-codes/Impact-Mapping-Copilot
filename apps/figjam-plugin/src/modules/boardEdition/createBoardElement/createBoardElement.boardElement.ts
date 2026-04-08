import { ElementType, HIERARCHY_ORDER, TYPE_TO_COLOR } from '../../boardAnalysis/element';
import { CommandResult } from '../../shared/result/commandResult';
import type { NewShape } from './createBoardElement.boardWriter';

export type ParentInfo = {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  height: number;
};

const CHILD_OFFSET_Y = 120;

const TYPE_LABELS: Record<ElementType, string> = {
  [ElementType.OBJECTIVE]: 'un objectif',
  [ElementType.ACTOR]: 'un acteur',
  [ElementType.IMPACT]: 'un impact',
  [ElementType.ACTION]: 'une action',
  [ElementType.USER_STORY]: 'une user story',
  [ElementType.RULE]: 'une règle',
  [ElementType.SCENARIO]: 'un scénario',
};

export class BoardElement {
  readonly shape: NewShape;
  readonly parentId?: string;

  private constructor(shape: NewShape, parentId?: string) {
    this.shape = shape;
    this.parentId = parentId;
  }

  static withoutParent(
    elementType: ElementType,
    viewportCenter: { x: number; y: number },
  ): BoardElement {
    return new BoardElement({
      text: '',
      hexColor: TYPE_TO_COLOR[elementType],
      x: viewportCenter.x,
      y: viewportCenter.y,
    });
  }

  static withParent(
    elementType: ElementType,
    parent: ParentInfo,
  ): CommandResult<string> {
    const parentLevel = HIERARCHY_ORDER.indexOf(parent.type);
    const childLevel = HIERARCHY_ORDER.indexOf(elementType);

    if (childLevel - parentLevel !== 1) {
      const expectedChildType = HIERARCHY_ORDER[parentLevel + 1];
      const expectedLabel = expectedChildType ? TYPE_LABELS[expectedChildType] : undefined;
      const parentLabel = TYPE_LABELS[parent.type];
      return CommandResult.failure(
        expectedLabel
          ? `Impossible de créer ${TYPE_LABELS[elementType]} sous ${parentLabel}. Enfant attendu : ${expectedLabel}.`
          : `${parentLabel} ne peut pas avoir d'enfant.`,
      );
    }

    const element = new BoardElement(
      {
        text: '',
        hexColor: TYPE_TO_COLOR[elementType],
        x: parent.x,
        y: parent.y + parent.height + CHILD_OFFSET_Y,
      },
      parent.id,
    );

    return CommandResult.success(element);
  }
}
