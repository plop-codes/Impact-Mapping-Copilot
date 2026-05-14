import { describe, expect, it } from 'vitest';
import { aggregate, type ImpactMappingContext } from '../src/aggregator';

describe('aggregate', () => {
  const baseContext: ImpactMappingContext = {
    objective: { figjamId: 'obj-1', title: 'Augmenter le CA' },
    actor: { figjamId: 'act-1', title: 'ADV' },
    impact: { figjamId: 'imp-1', title: 'Saisir plus vite' },
    action: { figjamId: 'action-1', title: 'Saisir une commande' },
    userStory: {
      figjamId: 'us-1',
      title: 'Saisir une commande standard',
      body: 'En tant qu ADV je veux saisir une commande standard',
      boundedContext: 'orderEntry',
      domain: 'sales',
      milestone: 'v1',
    },
    scenarios: [
      {
        figjamId: 'sc-1',
        title: 'Saisie nominale',
        body: 'Etant donne ...\n\nQuand ...\n\nAlors ...',
        testDrivers: ['backend-use-case', 'backend-e2e', 'ui'],
      },
      {
        figjamId: 'sc-2',
        title: 'Acces refuse sans authentification',
        body: 'Etant donne ...\n\nQuand ...\n\nAlors ...',
        testDrivers: ['backend-e2e', 'ui'],
      },
    ],
  };

  it('produit un parent agrege Objectif+Acteur+Impact+Action', () => {
    const result = aggregate(baseContext);
    const parent = result.find((i) => i.kind === 'parent');
    expect(parent).toBeDefined();
    expect(parent?.figjamId).toBe('action-1');
    expect(parent?.title).toBe('Saisir une commande');
    expect(parent?.body).toContain('## Objectif');
    expect(parent?.body).toContain('Augmenter le CA');
    expect(parent?.body).toContain('## Acteur');
    expect(parent?.body).toContain('ADV');
    expect(parent?.body).toContain('## Impact');
    expect(parent?.body).toContain('## Action');
    expect(parent?.parentFigjamId).toBeUndefined();
  });

  it('produit une US enfant du parent avec bounded context et domain', () => {
    const result = aggregate(baseContext);
    const us = result.find((i) => i.kind === 'user-story');
    expect(us?.figjamId).toBe('us-1');
    expect(us?.parentFigjamId).toBe('action-1');
    expect(us?.body).toContain('## Bounded Context');
    expect(us?.body).toContain('orderEntry');
    expect(us?.body).toContain('## Domain');
    expect(us?.body).toContain('sales');
  });

  it('produit un scenario par entree, enfant de la US, avec labels test:* selon testDrivers', () => {
    const result = aggregate(baseContext);
    const scenarios = result.filter((i) => i.kind === 'scenario');
    expect(scenarios).toHaveLength(2);
    expect(scenarios[0].figjamId).toBe('sc-1');
    expect(scenarios[0].parentFigjamId).toBe('us-1');
    expect(scenarios[0].labels).toEqual(['test:backend-use-case', 'test:backend-e2e', 'test:ui']);
    expect(scenarios[1].labels).toEqual(['test:backend-e2e', 'test:ui']);
  });

  it('propage le milestone de la US au parent et aux scenarios', () => {
    const result = aggregate(baseContext);
    for (const i of result) {
      expect(i.milestone).toBe('v1');
    }
  });

  it('omet bounded context et domain si non fournis', () => {
    const ctx: ImpactMappingContext = {
      ...baseContext,
      userStory: { ...baseContext.userStory, boundedContext: undefined, domain: undefined },
    };
    const us = aggregate(ctx).find((i) => i.kind === 'user-story');
    expect(us?.body).not.toContain('## Bounded Context');
    expect(us?.body).not.toContain('## Domain');
  });
});
