import { describe, test } from 'vitest';
import {
  GetIterationRefinementRequestWhenPendingE2eDriver,
  GetIterationRefinementRequestWhenNonePendingE2eDriver,
} from './getIterationRefinementRequest.e2eDriver.js';

describe('Get user stories in iteration for refinement', () => {
  test('Claude récupère les User Stories d\'une itération en attente', async () => {
    const driver = new GetIterationRefinementRequestWhenPendingE2eDriver();

    await driver.givenTheServerIsRunning();
    await driver.givenAnIterationRefinementRequestWasSent({
      section: 'v1',
      userStories: [
        {
          hierarchy: {
            rule: {
              id: 'rule-1',
              title: 'Validation des commandes',
              body: 'Une commande doit avoir au moins une ligne',
              examples: [
                { id: 'ex-1', body: 'Commande avec 0 ligne -> refusée' },
                { id: 'ex-2', body: 'Commande avec 1 ligne -> acceptée' },
              ],
            },
            rules: [
              {
                id: 'rule-1',
                title: 'Validation des commandes',
                body: 'Une commande doit avoir au moins une ligne',
                examples: [
                  { id: 'ex-1', body: 'Commande avec 0 ligne -> refusée' },
                  { id: 'ex-2', body: 'Commande avec 1 ligne -> acceptée' },
                ],
              },
            ],
            section: 'v1',
            userStory: { id: 'us-1', title: 'Saisir une commande', body: 'En tant que...' },
          },
          glossary: [{ term: 'Commande', definitions: { default: 'Demande client' } }],
        },
      ],
    });
    await driver.whenClaudeCallsGetIterationRefinementRequest();
    driver.thenThePendingRequestIsReturned({
      section: 'v1',
      userStories: [
        {
          hierarchy: {
            rule: {
              id: 'rule-1',
              title: 'Validation des commandes',
              body: 'Une commande doit avoir au moins une ligne',
              examples: [
                { id: 'ex-1', body: 'Commande avec 0 ligne -> refusée' },
                { id: 'ex-2', body: 'Commande avec 1 ligne -> acceptée' },
              ],
            },
            rules: [
              {
                id: 'rule-1',
                title: 'Validation des commandes',
                body: 'Une commande doit avoir au moins une ligne',
                examples: [
                  { id: 'ex-1', body: 'Commande avec 0 ligne -> refusée' },
                  { id: 'ex-2', body: 'Commande avec 1 ligne -> acceptée' },
                ],
              },
            ],
            section: 'v1',
            userStory: { id: 'us-1', title: 'Saisir une commande', body: 'En tant que...' },
          },
          glossary: [{ term: 'Commande', definitions: { default: 'Demande client' } }],
        },
      ],
    });
  });

  test('Claude ne trouve aucune demande de raffinement en attente', async () => {
    const driver = new GetIterationRefinementRequestWhenNonePendingE2eDriver();

    await driver.givenTheServerIsRunning();
    await driver.givenNoIterationRefinementRequestIsPending();
    await driver.whenClaudeCallsGetIterationRefinementRequest();
    driver.thenNoPendingRequestIsReturned();
  });
});
