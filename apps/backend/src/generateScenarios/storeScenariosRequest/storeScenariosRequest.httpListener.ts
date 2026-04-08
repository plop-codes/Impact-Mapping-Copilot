import type { PluginConnection } from '../../shared/pluginConnection.js';
import type { StoreScenariosRequestRepository } from './storeScenariosRequest.repository.js';
import { StoreScenariosRequestUseCase } from './storeScenariosRequest.useCase.js';

export class StoreScenariosRequestHttpListener {
  constructor(
    connection: PluginConnection,
    repository: StoreScenariosRequestRepository,
  ) {
    const useCase = new StoreScenariosRequestUseCase(repository);

    connection.onPost('/scenario-request', (raw, res) => {
      try {
        const body = JSON.parse(raw) as { ruleId: string; ruleTitle: string };
        useCase.execute(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        process.stderr.write(`[mcp] Scenario request received for rule: ${body.ruleTitle}\n`);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  }
}
