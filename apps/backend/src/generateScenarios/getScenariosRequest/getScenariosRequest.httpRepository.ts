import type { GetScenariosRequestRepository, ScenarioRequest } from './getScenariosRequest.repository.js';

export class GetScenariosRequestHttpRepository implements GetScenariosRequestRepository {
  constructor(private readonly port: number) {}

  async get(): Promise<ScenarioRequest | null> {
    const r = await fetch(`http://127.0.0.1:${this.port}/__internal/scenario-request/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { request: ScenarioRequest | null };
    return j.request;
  }
}
