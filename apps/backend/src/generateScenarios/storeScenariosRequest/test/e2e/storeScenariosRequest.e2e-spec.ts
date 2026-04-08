import { describe, test } from 'vitest';
import { StoreScenariosRequestE2eDriver } from './storeScenariosRequest.e2eDriver.js';

describe('Store scenarios request', () => {
  test('le plugin envoie une demande de scénarios, elle est stockée et récupérable par Claude', async () => {
    const driver = new StoreScenariosRequestE2eDriver();

    await driver.givenTheServerIsRunning();
    await driver.whenThePluginSendsAScenarioRequest({
      ruleId: '123:456',
      ruleTitle: 'Règle de validation des commandes',
    });
    await driver.thenTheScenarioRequestIsStored({
      ruleId: '123:456',
      ruleTitle: 'Règle de validation des commandes',
    });
  });
});
