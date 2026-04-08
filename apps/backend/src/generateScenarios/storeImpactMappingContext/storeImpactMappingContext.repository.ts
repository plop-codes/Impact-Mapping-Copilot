import type { ImpactMappingContext } from '../impactMappingContext.js';

export interface StoreImpactMappingContextRepository {
  save(data: ImpactMappingContext): void;
}
