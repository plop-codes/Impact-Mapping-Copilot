import type { SubmitScenariosPluginNotifier, GeneratedScenario } from './submitScenarios.pluginNotifier.js';
import type { SubmitScenariosRepository } from './submitScenarios.repository.js';

export class SubmitScenariosUseCase {
  constructor(
    private readonly pluginNotifier: SubmitScenariosPluginNotifier,
    private readonly repository: SubmitScenariosRepository,
  ) {}

  execute(ruleId: string, scenarios: GeneratedScenario[]): void {
    this.pluginNotifier.notifyScenariosGenerated(ruleId, scenarios);
    this.repository.remove();
  }
}
