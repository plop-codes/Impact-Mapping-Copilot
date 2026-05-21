# CLAUDE.md — Impact Mapping Copilot

## Project Stack

- Plugin FigJam (TypeScript)
- Build: esbuild (bundle → `dist/code.js`)
- Tests: Vitest
- Typings: `@figma/plugin-typings`
- Language: TypeScript strict. Do NOT use JavaScript.
- Always update CLAUDE.md after implementing significant architectural changes or new conventions.

---

## Projet

Plugin FigJam qui analyse un board d'impact mapping (shapes colorés, connecteurs directionnels, sections) et déclenche depuis Claude Code un pipeline ATDD complet. Le plugin ne fait plus de sync GitHub : il pousse des `scenarioRequest` au backend MCP, Claude Code orchestre la génération et la synchronisation GitHub via le CLI `github-sync`.

---

## Monorepo Structure

```
apps/
├── figjam-plugin/     # Plugin FigJam (esbuild → dist/code.js)
├── backend/           # Serveur MCP pour Claude Code (tsc → dist/)
└── github-sync/       # CLI + lib pour synchroniser la hierarchie agrégée vers GitHub Issues (tsc → dist/)
```

## Installation

```bash
npm install            # installe les workspaces depuis la racine
```

## Scripts

```bash
# Plugin FigJam
cd apps/figjam-plugin
npm run build          # esbuild → dist/code.js
npm run test:unit      # vitest run
npm run test:watch     # vitest (watch mode)

# Backend (serveur MCP)
cd apps/backend
npm run build          # tsc → dist/
npm run test:e2e       # vitest e2e tests

# CLI github-sync
cd apps/github-sync
npm run build          # tsc → dist/
npm run test:unit      # vitest run
```

## Serveur MCP — Démarrage

Le serveur MCP est lancé **automatiquement par Claude Code** via la config `.mcp.json` à la racine du projet (`node apps/backend/dist/index.js`). Il communique via stdio avec Claude Code et expose un serveur HTTP sur le port 3333 pour recevoir les `scenarioRequest` du plugin FigJam (POST `/scenario-request`). La communication est strictement plugin → backend ; il n'y a aucun canal retour backend → plugin (l'orchestrateur ATDD écrit directement sur GitHub via le CLI `github-sync`).

**Mode primary vs proxy** : une seule instance peut binder le port 3333 (l'instance *primary*). Toute instance lancée alors que le port est déjà pris démarre automatiquement en mode *proxy* : son transport MCP stdio sert normalement le tool `get_scenario_request`, mais la repository est remplacée par des appels HTTP `/__internal/scenario-request/get` vers l'instance primary. Permet d'ouvrir plusieurs sessions Claude Code (plusieurs projets) partageant la même demande plugin courante. Implémenté dans `apps/backend/src/shared/pluginConnection.ts` et `apps/backend/src/generateScenarios/generateScenarios.module.ts`.

**Cycle de vie / arrêt propre** : le serveur HTTP (port 3333) garde l'event loop Node vivante. Sans terminaison explicite, le process survivrait en orphelin après la fin d'une session Claude Code (transport stdio coupé mais port toujours bindé) → le MCP afficherait `failed` au redémarrage suivant car l'orphelin squatte 3333. `index.ts` écoute donc la **fermeture de stdin** (`'end'`/`'close'` = session Claude Code terminée ou `/clear`) ainsi que `SIGTERM`/`SIGINT`, et appelle `connection.close()` puis `process.exit(0)`. Si malgré tout un orphelin subsiste (ancien binaire sans ce correctif, `kill -9`…), `npm run server:stop` libère le port.

**Scripts npm racine** pour gérer une instance primary persistante indépendante d'une session Claude Code :
- `npm run server:start` — lance le backend en background sur :3333, logs dans `/tmp/impact-mapping-copilot.log`
- `npm run server:stop` — kill ce qui écoute sur :3333
- `npm run server:restart`, `npm run server:status`

**Après une modification du code du serveur MCP :**
1. `cd apps/backend && npm run build`
2. Relancer Claude Code (nouvelle session) pour que le serveur MCP soit redémarré avec le code recompilé (ou `npm run server:restart` si on utilise l'instance persistante)

---

## Périmètre du plugin (volontairement réduit)

Le plugin garde **uniquement** :
1. Lire le board d'impact mapping (analyse des shapes, connecteurs, sections, propagation des releases)
2. Pousser des `scenarioRequest` au backend MCP via HTTP POST `/scenario-request` (avec `ruleId`, `ruleTitle`, `hierarchy` agrégée, `glossary`) quand l'utilisateur clique "Générer les scénarios de cette règle"
3. Pousser une `iterationRefinementRequest` au backend MCP via HTTP POST `/iteration-refinement-request` (avec `section` + toutes les US de la section triées par x, chacune avec `hierarchy` + `glossary`) quand l'utilisateur sélectionne une **SECTION** et clique "Raffiner les US de cette itération"
4. Créer manuellement de nouveaux éléments (OBJECTIVE, ACTOR, IMPACT, ACTION, USER_STORY, RULE) sur le board

Le plugin a **perdu** :
- Toute la sync GitHub (rapatriée dans `apps/github-sync/` et orchestrée depuis Claude Code)
- L'extraction des sections `vision produit` et `acteurs opérationnels` (jamais utilisée par la nouvelle chaîne — seul le `glossaire` reste lu et inclus dans `scenarioRequest`)
- La création des shapes SCENARIO sur le board (la source de vérité des scénarios devient GitHub, plus le board)
- La sync GitHub Project (Project field "figjam_element_id" remplacé par un marqueur HTML `<!-- figjam-id:* -->` dans le body)
- Le canal retour backend → plugin (WebSocket `REFRESH`, POST `/board-data` au backend) : tout est mort puisque l'orchestrateur ATDD écrit directement sur GitHub. Plus de WebSocket nulle part.

---

## Pipeline complet (vue d'ensemble)

```
Plugin FigJam (clic "générer scénarios")
        ↓ HTTP POST /scenario-request
Backend MCP (scenarioRequest stocké en mémoire)
        ↓ MCP tool get_scenario_request (polling)
Claude Code skill wait-cycle-request (orchestrateur, Discac Yoda)
        ↓ sub-agent générateur Opus 4.7 (grill-me + génération JSON scénarios)
        ↓ sub-agent reviewer-coverage Sonnet 4.6
        ↓ gate humain
        ↓ Bash: github-sync CLI
Issues GitHub (PARENT agrégé → US → sub-issues scénarios)
        ↓ pour chaque sub-issue × layer
Sub-agent ATDD Opus 4.7 (RED → reviewer test-fidelity → commit RED → GREEN → reviewers archi+intent → commit GREEN)
```

---

## Architecture

### Structure des fichiers (apps/figjam-plugin)

```
apps/figjam-plugin/src/
├── plugin.ts                              # Entry point (orchestre les use cases)
├── ui.html                                # UI du plugin (boutons de création + génération IA)
├── ui/ui.ts                               # Logique UI (HTTP POST scenarioRequest, postMessages plugin)
├── modules/
│   ├── boardAnalysis/
│   │   ├── element.ts                     # Types et constantes COLOR_TO_TYPE
│   │   ├── impactMapping.ts               # Types et constantes liés à la hiérarchie
│   │   ├── release.ts                     # Identification + assignation des releases (SectionNode)
│   │   ├── analyzeImpactMap/              # Use case principal : lecture du board → hiérarchie + warnings
│   │   └── analyzeContextElements/        # Use case : extraction du glossaire métier (section "Glossaire")
│   ├── boardEdition/
│   │   └── createBoardElement/            # Création manuelle d'éléments sur le board
│   └── shared/
│       └── result/
│           └── commandResult.ts           # CommandResult<E>
```

### Structure des fichiers (apps/github-sync)

```
apps/github-sync/
├── src/
│   ├── types.ts                  # Fetcher, GithubConfig, Logger
│   ├── issuable.ts               # Issuable plat (kind, title, body, labels, milestone, parentFigjamId)
│   ├── bodyMarkers.ts            # Marqueur <!-- figjam-id:* --> + AutoBodyMarkers
│   ├── githubApiError.ts         # GithubApiError + githubFetch
│   ├── githubClient.ts           # CRUD issues + labels + milestones + sub-issues (sans Project)
│   ├── aggregator.ts             # ImpactMappingContext → Issuable[] hiérarchie agrégée
│   ├── syncer.ts                 # Orchestration idempotente (create / update + sub-issue links)
│   ├── cli.ts                    # runCli(stdinJson) → { exitCode, output }
│   └── index.ts                  # Public API
├── bin/
│   └── github-sync.js            # Bin: lit stdin, appelle runCli, écrit stdout, exit 0/1/2
├── test/                         # 19 tests Vitest (aggregator + bodyMarkers + syncer + CLI)
└── README.md
```

### Backend MCP — modules (apps/backend/src)

```
generateScenarios/
├── generateScenarios.module.ts            # Wiring MCP tool + HTTP listeners + routes /__internal/* (proxy)
├── scenarioRequest.ts                     # Types : ScenarioRequest + HierarchyContext + HierarchyRule (+ examples) + GlossaryEntry
├── scenarioRequest.inMemoryRepository.ts  # Repository in-memory partagée store/get (1 demande courante)
├── storeScenariosRequest/                 # HTTP listener : reçoit scenarioRequest (ruleId + ruleTitle + hierarchy + glossary) du plugin FigJam sur POST /scenario-request
└── getScenariosRequest/                   # MCP tool : get_scenario_request — retourne la demande complète avec hiérarchie et glossaire (+ httpRepository en mode proxy)

refineIteration/
├── refineIteration.module.ts                       # Wiring MCP tool + HTTP listener + routes /__internal/iteration-refinement-request/* (proxy)
├── iterationRefinementRequest.ts                   # Types : IterationRefinementRequest { section, userStories: { hierarchy, glossary }[] }
├── iterationRefinementRequest.inMemoryRepository.ts# Repository in-memory partagée store/get (1 demande courante)
├── storeIterationRefinementRequest/                # HTTP listener : reçoit la demande (section + toutes les US triées par x avec règles + examples) sur POST /iteration-refinement-request
└── getIterationRefinementRequest/                  # MCP tool : get_user_stories_in_iteration_for_refinement — retourne toutes les US d'une section (+ httpRepository en mode proxy)
```

### Examples sur une règle (atelier d'impact mapping)

Une `HierarchyRule` peut porter un champ `examples: { id, body }[]` : ce sont les shapes FigJam **SCENARIO enfants du shape de la règle**, c.-à-d. les exemples concrets discutés avec le métier en atelier. Ce **ne sont pas** des scénarios de test exploitables (ceux-ci naissent plus tard comme sub-issues GitHub). Extraits côté plugin dans `buildHierarchyContext()` (texte pris depuis `el.text` du SCENARIO), exposés par les deux tools MCP (`get_scenario_request` et `get_user_stories_in_iteration_for_refinement`).

Les modules supprimés (historique) :
- `submitScenarios/` : la source de vérité des scénarios est désormais GitHub (sub-issues créées par le CLI `github-sync`)
- `getImpactMappingContext/` (tool `get_board_data`) et `storeImpactMappingContext/` (écriture `.board-data.json`) : le contexte impact mapping + glossaire est désormais embarqué dans le payload `scenarioRequest` directement par le plugin FigJam au clic « Générer scénarios »
- Canal `sendToPlugin` / WebSocket / routes `/__internal/plugin/*` : plus aucun retour backend → plugin nécessaire (l'orchestrateur ATDD écrit directement sur GitHub via le CLI `github-sync`)

---

## Logique métier dans le domaine (boardAnalysis)

- La hiérarchie (parent-child validation) vit dans `BoardElement.isDirectParentOf()`
- Le containment géométrique vit dans `ShapeBounds.isContainedIn()`
- La propagation des releases vit dans `HierarchyNode.propagateRelease()`
- L'assignation des releases vit dans `ImpactMap.assignReleases()`
- La construction de l'arbre vit dans `ImpactMap.buildHierarchy()`
- Le mapping couleur → type vit dans `ElementColor.toElementType()`
- La validation des shapes vit dans `BoardElement.isValidShape()`

---

## Détails techniques — Impact Mapping

### Couleurs des types

| Type | Hex |
|------|-----|
| OBJECTIVE | `#1E3A8A` |
| ACTOR | `#7C3AED` |
| IMPACT | `#16A34A` |
| ACTION | `#EA580C` |
| USER_STORY | `#FACC15` |
| RULE | `#64748B` |
| SCENARIO | `#CBD5E1` (les SCENARIO restent reconnus pour la lecture du board legacy, mais la création manuelle a été retirée de l'UI : ils naissent désormais comme sub-issues GitHub) |

### Concepts latéraux (hors hiérarchie)

| Concept | Hex | Rôle |
|---------|-----|------|
| BOUNDED_CONTEXT | `#1E1E1E` | Rattaché à USER_STORY/ACTION via connecteur |
| DOMAIN | `#CDF4D3` | Parent d'un BOUNDED_CONTEXT via connecteur (generic, core, etc.) |

Chaîne de résolution : `DOMAIN → BC → USER_STORY/ACTION`. Le domain est propagé aux éléments qui ont un bounded context rattaché.

### Hiérarchie stricte

`OBJECTIVE → ACTOR → IMPACT → ACTION → USER_STORY → RULE → SCENARIO`

Un connecteur est valide seulement si le type parent est exactement un niveau au-dessus du type enfant. Validé par `BoardElement.isDirectParentOf()`.

### Shapes valides

- `ShapeWithTextNode` avec `shapeType` = `SQUARE` ou `ROUNDED_RECTANGLE`
- Texte non vide obligatoire
- Couleur connue obligatoire
- Validé par `BoardElement.isValidShape()`

### Couleurs Figma

- Stockées en float 0-1 (`{ r, g, b }`). Conversion via `ElementColor.fromRgb()`.
- Comparaison en uppercase.

### Sections / Releases

- Les releases sont des `SectionNode` FigJam, modélisées par `ReleaseSection`
- Section avec nom non vide = release valide (`ReleaseSection.isValid`)
- Containment : centre du shape dans les bounds de la section (`ShapeBounds.isContainedIn()`)

### Propagation des releases

- Une user story dans une section reçoit la release
- Ses enfants (rules, scenarios) héritent de la release du parent
- Propagation via `HierarchyNode.propagateRelease()`

---

## Idempotence GitHub (github-sync)

Chaque issue créée par le CLI porte un marqueur HTML en première ligne du body :

```
<!-- figjam-id:{nodeId} -->
<!-- figjam:auto-start -->
... contenu auto ...
<!-- figjam:auto-end -->

[ contenu manuel optionnel, préservé lors d'un update ]
```

Un re-run du CLI identifie les issues existantes via ce marqueur (paginé sur `GET /repos/{owner}/{repo}/issues?state=all`) et fait un `PATCH` au lieu d'un `POST`. Le contenu manuel après `<!-- figjam:auto-end -->` est préservé lors d'un update.

---

## Vérification obligatoire après modification

```bash
cd apps/figjam-plugin && npm run test:unit    # Tous les tests passent
cd apps/figjam-plugin && npm run build        # Bundle produit dist/code.js sans erreur
cd apps/backend && npm run build              # Serveur MCP compile sans erreur
cd apps/backend && npm run test:e2e           # Tests e2e backend passent
cd apps/github-sync && npm run build          # CLI compile sans erreur
cd apps/github-sync && npm run test:unit      # Tests CLI passent (19 tests)
```
