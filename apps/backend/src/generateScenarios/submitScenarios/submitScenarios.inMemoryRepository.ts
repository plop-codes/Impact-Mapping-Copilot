import { scenarioRequests } from '../scenarioRequests.inMemoryStore.js';
import type { SubmitScenariosRepository } from './submitScenarios.repository.js';

export class SubmitScenariosInMemoryRepository implements SubmitScenariosRepository {
  remove(): void {
    scenarioRequests.value = null;
  }
}
