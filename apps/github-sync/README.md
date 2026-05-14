# @impact-mapping/github-sync

CLI + lib pour synchroniser une hierarchie d'impact mapping vers GitHub Issues, en mode idempotent.

## Schema cible

```
Issue PARENT = Objectif + Acteur + Impact + Action (1 ticket agrege)
  Issue USER STORY
    Sub-issue SCENARIO #1  (labels test:* selon testDrivers)
    Sub-issue SCENARIO #2
    ...
```

## Idempotence

Chaque issue creee porte un marqueur HTML `<!-- figjam-id:{nodeId} -->` en premiere ligne du body. Un re-run identifie les issues existantes par ce marqueur et fait un `PATCH` au lieu d'un `POST`. Le contenu manuel ajoute apres la balise `<!-- figjam:auto-end -->` est preserve lors d'un update.

## CLI

```bash
echo '{
  "github": { "token": "ghp_...", "owner": "o", "repo": "r" },
  "payload": {
    "kind": "aggregated-context",
    "context": {
      "objective": { "figjamId": "obj-1", "title": "Augmenter le CA" },
      "actor": { "figjamId": "act-1", "title": "ADV" },
      "impact": { "figjamId": "imp-1", "title": "Saisir plus vite" },
      "action": { "figjamId": "action-1", "title": "Saisir une commande" },
      "userStory": {
        "figjamId": "us-1",
        "title": "Saisir une commande standard",
        "boundedContext": "orderEntry",
        "domain": "sales",
        "milestone": "v1"
      },
      "scenarios": [
        {
          "figjamId": "sc-1",
          "title": "Saisie nominale",
          "body": "Etant donne...\n\nQuand...\n\nAlors...",
          "testDrivers": ["backend-use-case", "backend-e2e", "ui"]
        }
      ]
    }
  }
}' | node apps/github-sync/bin/github-sync.js
```

Codes de sortie : `0` succes, `1` erreur partielle (certaines issues echouees, voir `errors` dans le resume), `2` erreur fatale (config / JSON invalide).

Le resume JSON est ecrit sur stdout, les logs sur stderr.

## Forme alternative — `issuables` directs

Si tu veux contourner l'aggregator et passer directement les issues :

```json
{
  "github": { ... },
  "payload": {
    "kind": "issuables",
    "issuables": [
      { "figjamId": "...", "kind": "parent", "title": "...", "body": "...", "labels": [], "milestone": "v1" },
      { "figjamId": "...", "parentFigjamId": "...", "kind": "user-story", ... },
      ...
    ]
  }
}
```

## API programmatique

```ts
import { aggregate, GithubClient, Syncer } from '@impact-mapping/github-sync';

const issuables = aggregate(impactMappingContext);
const client = new GithubClient(githubConfig, fetch, console.log);
const syncer = new Syncer(client, `${owner}/${repo}`, console.log);
const summary = await syncer.sync(issuables);
```

## Build et tests

```bash
cd apps/github-sync
npm run build       # tsc -> dist/
npm run test:unit   # vitest run
```
