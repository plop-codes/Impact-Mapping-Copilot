import type {
  GetIterationRefinementRequestRepository,
  IterationRefinementRequest,
} from './getIterationRefinementRequest.repository.js';

export class GetIterationRefinementRequestHttpRepository
  implements GetIterationRefinementRequestRepository
{
  constructor(private readonly port: number) {}

  async get(): Promise<IterationRefinementRequest | null> {
    const r = await fetch(`http://127.0.0.1:${this.port}/__internal/iteration-refinement-request/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { request: IterationRefinementRequest | null };
    return j.request;
  }
}
