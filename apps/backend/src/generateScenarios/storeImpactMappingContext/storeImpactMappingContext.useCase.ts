import type { ImpactMappingContext } from '../impactMappingContext.js';
import type { StoreImpactMappingContextRepository } from './storeImpactMappingContext.repository.js';

export class StoreImpactMappingContextUseCase {
  constructor(private readonly repository: StoreImpactMappingContextRepository) {}

  execute(data: ImpactMappingContext): void {
    this.repository.save(data);
  }
}
