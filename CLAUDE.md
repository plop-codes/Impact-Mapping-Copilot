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

Plugin FigJam qui analyse un board d'impact mapping (shapes colorés, connecteurs directionnels, sections) et produit un JSON hiérarchique structuré pour transformer un atelier en backlog GitHub.

---

## Monorepo Structure

```
apps/
├── figjam-plugin/     # Plugin FigJam (esbuild → dist/code.js)
└── backend/           # Serveur MCP pour Claude Code (tsc → dist/)
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
```

## Serveur MCP — Démarrage

Le serveur MCP est lancé **automatiquement par Claude Code** via la config `.mcp.json` à la racine du projet (`node apps/backend/dist/index.js`). Il communique via stdio avec Claude Code et expose un serveur HTTP+WebSocket sur le port 3333 pour le plugin FigJam.

**Après une modification du code du serveur MCP :**
1. `cd apps/backend && npm run build`
2. Relancer Claude Code (nouvelle session) pour que le serveur MCP soit redémarré avec le code recompilé

---

## Architecture

### Structure des fichiers (apps/figjam-plugin)

```
apps/figjam-plugin/src/
├── plugin.ts                              # Entry point (orchestre les use cases)
├── modules/
│   ├── boardAnalysis/
│   │   ├── elementType.ts                 # Enum des types (enum seulement)
│   │   ├── elementColor.ts                # Value object (color mapping + RGB→hex)
│   │   ├── shapeBounds.ts                 # Value object (bounds + containment géométrique)
│   │   ├── boardElement.ts                # Entité riche (hierarchy, release, title, validation)
│   │   ├── releaseSection.ts              # Value object (section + validité + containment)
│   │   ├── hierarchyNode.ts               # Entité (tree node + propagation release)
│   │   ├── impactMap.ts                   # Aggregate root (assignReleases + buildHierarchy)
│   │   ├── rawTypes.ts                    # RawBoardShape, RawConnector, RawSection (DTOs)
│   │   ├── analyzeImpactMap/
│   │   │   ├── analyzeImpactMap.useCase.ts           # Use case — orchestrateur impact mapping
│   │   │   ├── analyzeImpactMap.boardReader.ts       # Port (interface)
│   │   │   ├── analyzeImpactMap.figmaBoardReader.ts  # Adaptateur Figma
│   │   │   └── test/
│   │   │       ├── analyzeImpactMap.dsl.ts
│   │   │       ├── analyzeImpactMap.inMemoryBoardReader.ts
│   │   │       └── usecase/
│   │   │           ├── analyzeImpactMap.useCase.spec.ts
│   │   │           └── analyzeImpactMap.useCaseDriver.ts
│   │   └── analyzeContextElements/
│   │       ├── contextElements.ts                                    # Types domaine (GlossaryEntry, ContextElementsJson)
│   │       ├── analyzeContextElements.contextReader.ts               # Port (interface)
│   │       ├── analyzeContextElements.useCase.ts                     # Use case — vision, acteurs, glossaire
│   │       ├── analyzeContextElements.figmaContextReader.ts          # Adaptateur Figma (sections + TableNode)
│   │       └── test/
│   │           ├── analyzeContextElements.dsl.ts
│   │           ├── analyzeContextElements.inMemoryContextReader.ts
│   │           └── usecase/
│   │               ├── analyzeContextElements.useCase.spec.ts
│   │               └── analyzeContextElements.useCaseDriver.ts
│   └── shared/
│       └── result/
│           └── commandResult.ts                       # CommandResult<E>
```

---

## Logique métier dans le domaine

- La hiérarchie (parent-child validation) vit dans `BoardElement.isDirectParentOf()`
- Le containment géométrique vit dans `ShapeBounds.isContainedIn()`
- La propagation des releases vit dans `HierarchyNode.propagateRelease()`
- L'assignation des releases vit dans `ImpactMap.assignReleases()`
- La construction de l'arbre vit dans `ImpactMap.buildHierarchy()`
- Le mapping couleur → type vit dans `ElementColor.toElementType()`
- La validation des shapes vit dans `BoardElement.isValidShape()`
- L'extraction du titre scénario vit dans `BoardElement.title` (getter)

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
| SCENARIO | `#CBD5E1` |

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

## Vérification obligatoire après modification

```bash
cd apps/figjam-plugin && npm run test:unit    # Tous les tests passent
cd apps/figjam-plugin && npm run build        # Bundle produit dist/code.js sans erreur
cd apps/backend && npm run build              # Serveur MCP compile sans erreur
cd apps/backend && npm run test:e2e           # Tests e2e backend passent
```
