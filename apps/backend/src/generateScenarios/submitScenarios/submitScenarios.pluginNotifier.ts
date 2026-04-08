export type GeneratedScenario = {
  title: string;
  body?: string;
  testDrivers?: string[];
};

export interface SubmitScenariosPluginNotifier {
  notifyScenariosGenerated(ruleId: string, scenarios: GeneratedScenario[]): void;
}
