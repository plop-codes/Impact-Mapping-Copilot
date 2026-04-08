import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ImpactMappingContext } from '../impactMappingContext.js';
import type { StoreImpactMappingContextRepository } from './storeImpactMappingContext.repository.js';

const STORE_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '.board-data.json');

export class StoreImpactMappingContextFileRepository implements StoreImpactMappingContextRepository {
  save(data: ImpactMappingContext): void {
    writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  }
}
