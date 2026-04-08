import type { ElementType } from '../../boardAnalysis/element';
import { CommandResult } from '../../shared/result/commandResult';
import type { CreateBoardElementBoardWriter } from './createBoardElement.boardWriter';
import { BoardElement, type ParentInfo } from './createBoardElement.boardElement';

export type CreateBoardElementInput = {
  elementType: ElementType;
  parent: ParentInfo | null;
  viewportCenter: { x: number; y: number };
};

export class CreateBoardElementUseCase {
  constructor(private readonly boardWriter: CreateBoardElementBoardWriter) {}

  execute(input: CreateBoardElementInput): CommandResult<string> {
    const { elementType, parent, viewportCenter } = input;

    if (!parent) {
      const element = BoardElement.withoutParent(elementType, viewportCenter);
      const nodeId = this.boardWriter.createShapeWithText(element.shape);
      return CommandResult.success(nodeId);
    }

    const result = BoardElement.withParent(elementType, parent);
    if (result.isFailure()) return result;

    const element = result.getValue<BoardElement>();
    const nodeId = this.boardWriter.createShapeWithText(element.shape);
    this.boardWriter.createConnector(element.parentId!, nodeId);

    return CommandResult.success(nodeId);
  }
}
