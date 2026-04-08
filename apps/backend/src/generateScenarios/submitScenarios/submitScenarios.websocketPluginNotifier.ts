import type { PluginConnection } from '../../shared/pluginConnection.js';
import type { SubmitScenariosPluginNotifier, GeneratedScenario } from './submitScenarios.pluginNotifier.js';

export class WebsocketPluginNotifier implements SubmitScenariosPluginNotifier {
  constructor(private readonly connection: PluginConnection) {}

  notifyScenariosGenerated(ruleId: string, scenarios: GeneratedScenario[]): void {
    this.connection.sendToPlugin({
      type: 'SCENARIOS_GENERATED',
      ruleId,
      scenarios,
    });
  }
}
