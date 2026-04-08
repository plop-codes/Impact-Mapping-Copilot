import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ImpactMappingContext } from '../impactMappingContext.js';
import type { GetImpactMappingContextRepository } from './getImpactMappingContext.repository.js';

const STORE_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '.board-data.json');

export class GetImpactMappingContextFileRepository implements GetImpactMappingContextRepository {
  getData(): ImpactMappingContext | null {
    try {
      const raw = readFileSync(STORE_PATH, 'utf-8');
      return JSON.parse(raw) as ImpactMappingContext;
    } catch {
      return null;
    }
  }
}
