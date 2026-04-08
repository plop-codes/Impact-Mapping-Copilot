import type { ImpactMappingContext } from '../impactMappingContext.js';

export interface GetImpactMappingContextRepository {
  getData(): ImpactMappingContext | null;
}
