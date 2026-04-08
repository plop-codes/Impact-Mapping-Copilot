import { describe, test, afterEach } from 'vitest';
import { SubmitScenariosE2eDriver } from './submitScenarios.e2eDriver.js';

describe('Submit scenarios', () => {
  let driver: SubmitScenariosE2eDriver;

  afterEach(() => {
    driver?.cleanup();
  });

  test('Claude soumet des scénarios, le plugin les reçoit et la demande est supprimée', async () => {
    driver = new SubmitScenariosE2eDriver();

    await driver.givenTheServerIsRunning();
    await driver.givenThePluginIsConnectedViaWebSocket();
    await driver.givenAScenarioRequestIsPending({
      ruleId: '111:222',
      ruleTitle: 'Règle de facturation',
    });

    await driver.whenClaudeSubmitsScenarios('111:222', [
      { title: 'Scénario nominal de facturation' },
      { title: 'Scénario avec remise appliquée' },
    ]);

    await driver.thenThePluginReceivesTheScenarios({
      type: 'SCENARIOS_GENERATED',
      ruleId: '111:222',
      scenarios: [
        { title: 'Scénario nominal de facturation' },
        { title: 'Scénario avec remise appliquée' },
      ],
    });
    await driver.thenTheScenarioRequestIsRemoved();
  });
});
