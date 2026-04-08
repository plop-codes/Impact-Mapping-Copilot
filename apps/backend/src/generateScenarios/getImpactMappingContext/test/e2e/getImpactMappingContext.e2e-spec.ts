import { describe, test, afterEach } from 'vitest';
import {
  GetImpactMappingContextE2eDriver,
  GetImpactMappingContextWhenNoneStoredE2eDriver,
} from './getImpactMappingContext.e2eDriver.js';
import type { ImpactMappingContext } from '../../../impactMappingContext.js';

describe('Get impact mapping context', () => {
  let driver: GetImpactMappingContextE2eDriver | GetImpactMappingContextWhenNoneStoredE2eDriver;

  afterEach(() => {
    driver?.cleanup();
  });

  test('Claude récupère les données du board précédemment stockées', async () => {
    driver = new GetImpactMappingContextE2eDriver();

    const boardData: ImpactMappingContext = {
      elements: [
        {
          id: '1',
          type: 'OBJECTIVE',
          title: 'Réduire le churn',
          childrenIds: [],
        },
      ],
      warnings: ['Warning test'],
    };

    await driver.givenTheServerIsRunning();
    await driver.givenBoardDataWasPreviouslyStored(boardData);
    await driver.whenClaudeCallsGetBoardData();
    driver.thenTheImpactMappingContextIsReturned(boardData);
  });

  test('Claude reçoit une erreur quand aucune donnée n\'existe', async () => {
    driver = new GetImpactMappingContextWhenNoneStoredE2eDriver();

    await driver.givenTheServerIsRunning();
    driver.givenNoBoardDataWasStored();
    await driver.whenClaudeCallsGetBoardData();
    driver.thenAnErrorIsReturned();
  });
});
