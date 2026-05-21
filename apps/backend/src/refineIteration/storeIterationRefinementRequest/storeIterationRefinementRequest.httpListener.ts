import type { PluginConnection } from '../../shared/pluginConnection.js';
import type { IterationRefinementRequest } from '../iterationRefinementRequest.js';
import type { StoreIterationRefinementRequestRepository } from './storeIterationRefinementRequest.repository.js';
import { StoreIterationRefinementRequestUseCase } from './storeIterationRefinementRequest.useCase.js';

export class StoreIterationRefinementRequestHttpListener {
  constructor(
    connection: PluginConnection,
    repository: StoreIterationRefinementRequestRepository,
  ) {
    const useCase = new StoreIterationRefinementRequestUseCase(repository);

    connection.onPost('/iteration-refinement-request', (raw, res) => {
      try {
        const body = JSON.parse(raw) as IterationRefinementRequest;
        useCase.execute(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        process.stderr.write(
          `[mcp] Iteration refinement request received for section: ${body.section} (${body.userStories?.length ?? 0} US)\n`,
        );
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  }
}
