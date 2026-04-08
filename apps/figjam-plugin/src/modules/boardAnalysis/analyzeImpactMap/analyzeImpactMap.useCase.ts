import { ImpactMapping } from '../impactMapping';
import type { AnalyzeImpactMapBoardReader } from './analyzeImpactMap.boardReader';
import { CommandResult } from '../../shared/result/commandResult';

export class AnalyzeImpactMapUseCase {
  constructor(
    private readonly boardReader: AnalyzeImpactMapBoardReader,
  ) {}

  execute(): CommandResult<string> {
    const board = this.boardReader.readBoard();

    const result = ImpactMapping.generateFromBoard(board.shapes, board.connectors, board.sections, board.attachmentNodes);
    if (result.isFailure()) return CommandResult.failure(result.getError());

    return CommandResult.success(result.getValue<ImpactMapping>().toJson());
  }
}
