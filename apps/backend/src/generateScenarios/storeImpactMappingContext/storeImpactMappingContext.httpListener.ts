import type { PluginConnection } from '../../shared/pluginConnection.js';
import type { ImpactMappingContext } from '../impactMappingContext.js';
import type { StoreImpactMappingContextRepository } from './storeImpactMappingContext.repository.js';
import { StoreImpactMappingContextUseCase } from './storeImpactMappingContext.useCase.js';

export class StoreImpactMappingContextHttpListener {
  constructor(
    connection: PluginConnection,
    repository: StoreImpactMappingContextRepository,
  ) {
    const useCase = new StoreImpactMappingContextUseCase(repository);

    connection.onPost('/board-data', (raw, res) => {
      try {
        const body = JSON.parse(raw) as ImpactMappingContext;
        useCase.execute(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        process.stderr.write(`[mcp] Board data received: ${body.elements?.length ?? 0} elements\n`);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  }
}
