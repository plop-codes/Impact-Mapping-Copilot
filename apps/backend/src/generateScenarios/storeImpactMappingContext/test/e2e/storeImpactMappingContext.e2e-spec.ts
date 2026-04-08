import { describe, test, afterEach } from 'vitest';
import { StoreImpactMappingContextE2eDriver } from './storeImpactMappingContext.e2eDriver.js';
import type { ImpactMappingContext } from '../../../impactMappingContext.js';

describe('Store impact mapping context', () => {
  let driver: StoreImpactMappingContextE2eDriver;

  afterEach(() => {
    driver?.cleanup();
  });

  test('le plugin envoie les données du board, elles sont stockées et récupérables par Claude', async () => {
    driver = new StoreImpactMappingContextE2eDriver();

    const boardData: ImpactMappingContext = {
      elements: [
        {
          id: '1',
          type: 'OBJECTIVE',
          title: 'Augmenter le CA',
          childrenIds: ['2'],
        },
        {
          id: '2',
          type: 'ACTOR',
          title: 'Client final',
          parentId: '1',
          childrenIds: [],
        },
      ],
      warnings: [],
      productVision: ['Devenir leader du marché'],
    };

    await driver.givenTheServerIsRunning();
    await driver.whenThePluginSendsBoardData(boardData);
    await driver.thenTheBoardDataIsStored(boardData);
  });
});
