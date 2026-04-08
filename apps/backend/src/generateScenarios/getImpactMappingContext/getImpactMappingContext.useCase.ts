import type { GetImpactMappingContextRepository } from './getImpactMappingContext.repository.js';
import { CommandResult } from '../../shared/commandResult.js';

export class GetImpactMappingContextUseCase {
  constructor(private readonly repository: GetImpactMappingContextRepository) {}

  execute(): CommandResult<string> {
    const context = this.repository.getData();
    if (!context) return CommandResult.failure('Aucune donnée. Ouvrez le plugin dans FigJam puis réessayez.');
    return CommandResult.success<string>(context);
  }
}
