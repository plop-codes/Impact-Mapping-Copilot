import { describe, test } from 'vitest';
import {
  GetScenariosRequestWhenPendingE2eDriver,
  GetScenariosRequestWhenNonePendingE2eDriver,
} from './getScenariosRequest.e2eDriver.js';

describe('Get scenarios request', () => {
  test('Claude récupère une demande de scénarios en attente', async () => {
    const driver = new GetScenariosRequestWhenPendingE2eDriver();

    await driver.givenTheServerIsRunning();
    await driver.givenAScenarioRequestWasSent({
      ruleId: '789:012',
      ruleTitle: 'Règle de gestion des stocks',
    });
    await driver.whenClaudeCallsGetScenarioRequest();
    driver.thenThePendingRequestIsReturned({
      ruleId: '789:012',
      ruleTitle: 'Règle de gestion des stocks',
    });
  });

  test('Claude ne trouve aucune demande en attente', async () => {
    const driver = new GetScenariosRequestWhenNonePendingE2eDriver();

    await driver.givenTheServerIsRunning();
    await driver.givenNoScenarioRequestIsPending();
    await driver.whenClaudeCallsGetScenarioRequest();
    driver.thenNoPendingRequestIsReturned();
  });
});
