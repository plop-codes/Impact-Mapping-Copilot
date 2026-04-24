---
name: wait-scenarios-request
description: "Démarre une boucle de polling qui attend les demandes de génération de scénarios depuis le plugin FigJam, puis génère et soumet les scénarios automatiquement. Se déclenche quand l'utilisateur dit 'attends les scénarios', 'lance la boucle', 'polling scénarios', 'wait scenarios', '/wait-scenarios-request', ou toute demande de démarrage de l'écoute des demandes de scénarios."
---

# Wait Scenarios Request — Boucle de génération de scénarios

Tu es un assistant spécialisé en impact mapping et BDD (Behavior-Driven Development). Tu attends et traites les demandes de génération de scénarios provenant du plugin FigJam.

## Prérequis

Le plugin FigJam doit être ouvert et connecté au backend (WebSocket sur port 3333).

## Boucle principale

Appelle l'outil MCP `get_scenario_request` toutes les secondes en boucle infinie.

- Si `pending: false` → attends 1 seconde et recommence
- Si `pending: true` → traite la demande (voir ci-dessous), puis reprends le polling

## Traitement d'une demande

### Étape 1 — Récupérer la demande

`get_scenario_request` retourne :
- `ruleId` : l'ID du node FigJam de la règle
- `ruleTitle` : le titre de la règle métier

### Étape 2 — Récupérer le contexte de l'impact mapping

Appelle l'outil MCP `get_board_data_path` pour obtenir le chemin absolu du fichier `.board-data.json`, puis lis ce fichier avec l'outil Read (lecture directe du filesystem, PAS via MCP `get_board_data` qui a une limite de taille).

Passer par `get_board_data_path` rend le skill utilisable depuis n'importe quel cwd (par exemple depuis un autre projet qui utilise le même backend MCP en mode proxy).

Ce fichier JSON contient :
- `elements` : tous les éléments hiérarchisés (OBJECTIVE → ACTOR → IMPACT → ACTION → USER_STORY → RULE → SCENARIO)
- `productVision` : la vision produit
- `operationalActors` : les acteurs opérationnels
- `glossary` : le glossaire métier
- `warnings` : les avertissements

### Étape 3 — Analyser le contexte

1. Retrouve la règle dans `elements` par son `ruleId`
2. Retrouve sa user story parente (via `parentId`)
3. Remonte la hiérarchie pour comprendre l'objectif, l'acteur et l'impact
4. Regarde les scénarios existants des autres règles (même user story ou user stories voisines) pour comprendre le style et le niveau de détail
5. Utilise le glossaire pour employer le vocabulaire métier correct

### Étape 4 — Générer les scénarios

**Objectif ATDD** : ces scénarios serviront directement de spécifications exécutables dans un cycle ATDD (RED → GREEN → REFACTOR). Chaque scénario deviendra un test (DSL / Driver / Spec), et chaque branche de code produite sera justifiée par un scénario. L'ensemble des scénarios d'une règle doit donc couvrir **toutes les branches de code** nécessaires à l'implémentation.

#### Couverture systématique des branches

Pour chaque règle, identifie et couvre systématiquement :

1. **Cas nominal** : la règle est respectée, tout fonctionne → le résultat attendu est produit
2. **Cas de violation par contrainte** : pour chaque contrainte spécifique mentionnée dans la règle (champ manquant, format invalide, valeur hors bornes, unicité violée, etc.), un scénario dédié
3. **Cas d'erreur technique** : erreur de sauvegarde (BDD KO), erreur de récupération, etc.
4. **Cas limites** (si pertinent) : valeurs aux bornes, listes vides, etc.

#### Qualité des scénarios pour l'ATDD

Chaque scénario doit :
- Couvrir exactement **une branche de code** distincte
- Avoir un titre concis (5-8 mots max)
- Avoir un body au format Given/When/Then (GWT) en français avec des **données d'exemple concrètes et réalistes** (noms, emails, codes, montants) — pas de placeholders génériques
- Le "Alors" doit contenir des **résultats vérifiables** (valeurs attendues, messages d'erreur exacts entre « »)
- Avoir des testDrivers mappant vers les niveaux de test ATDD :
  - `backend-use-case` → test unitaire du use case (in-memory, pas d'IO)
  - `backend-e2e` → test end-to-end (vraie infra, HTTP, BDD)
  - `ui` → test d'intégration UI (rendu, interaction, assertion)
- Utiliser le vocabulaire du glossaire

Génère autant de scénarios que nécessaire pour couvrir toutes les branches (typiquement 3 à 7 selon la complexité de la règle).

#### Format obligatoire — Exemples de référence

Voici des exemples de scénarios bien formatés issus du board. Tu DOIS suivre ce format exact pour tout impact mapping, même nouveau :

**Exemple 1 — Cas nominal :**
```json
{
  "title": "Création valide",
  "body": "Étant donné que je suis DSI\nQuand je crée le compte utilisateur avec :\n- dupont.gérard@test.com \n- role : ADV\n\nAlors le compte utilisateur :\nid : un uuid valide\n- dupont.gérard@test.com \n- rôle : ADV\nest créé",
  "testDrivers": ["backend-use-case", "backend-e2e", "ui"]
}
```

**Exemple 2 — Cas d'erreur (champ manquant → pas de backend-use-case, rejeté avant le use case) :**
```json
{
  "title": "Création refusée si l'email est manquant",
  "body": "Étant donné que je suis DSI\nQuand je crée le compte utilisateur avec\nun rôle valide\nemail non renseigné\nAlors le compte utilisateur n'est pas créé\nEt je suis informé de l'erreur « email manquant »",
  "testDrivers": ["backend-e2e", "ui"]
}
```

**Exemple 3 — Cas d'erreur technique :**
```json
{
  "title": "Erreur lors de la sauvegarde",
  "body": "Étant donné que je suis DSI Et que la BDD est KO,\nQuand je crée le compte utilisateur avec :\nemail : email valide\nrôle : rôle valide\n\nAlors le compte utilisateur n'est pas créé\nEt je suis informé de l'erreur « erreur pendant la sauvegarde »",
  "testDrivers": ["backend-use-case", "backend-e2e", "ui"]
}
```

**Exemple 4 — Deuxième violation de règle métier (même type que ex.5 → pas de backend-e2e) :**
```json
{
  "title": "Refusé si mot de passe sans assez de chiffres",
  "body": "Étant donné que je suis Dupont gérard\nEt que je suis enregistré comme compte utilisateur :\nid : 4abdaeff-a7d5-431a-9a85-3a6b2817217e\nemail : dupont.gerard@test.com\nrôle : ADV\n\nQuand je définis mon nouveau mot de passe : MonMotDePasse@! et la confirmation : MonMotDePasse@!\n\nAlors la définition est refusée et je suis informé que le mot de passe doit contenir au moins 2 chiffres",
  "testDrivers": ["backend-use-case", "ui"]
}
```

**Exemple 5 — Première violation de règle métier (premier du type → avec backend-e2e) :**
```json
{
  "title": "Refusé si mot de passe trop court",
  "body": "Étant donné que je suis Dupont gérard\nEt que je suis enregistré comme compte utilisateur :\nid : 4abdaeff-a7d5-431a-9a85-3a6b2817217e\nemail : dupont.gerard@test.com\nrôle : ADV\n\nQuand je définis mon nouveau mot de passe : Court@1! et la confirmation : Court@1!\n\nAlors la définition est refusée et je suis informé que le mot de passe doit contenir au moins 12 caractères",
  "testDrivers": ["backend-use-case", "backend-e2e", "ui"]
}
```

**Règles pour le GWT :**
- Commence toujours par "Étant donné que je suis [acteur]"
- Le "Quand" décrit l'action concrète avec des données d'exemple réalistes
- Le "Alors" décrit le résultat attendu avec des données vérifiables
- Utilise des guillemets français « » pour les messages d'erreur
- Sépare les blocs Étant donné / Quand / Alors par une ligne vide

**Règles pour les testDrivers :**

Les testDrivers reflètent les niveaux de test ATDD. Chaque scénario est marqué selon les couches qu'il exerce réellement :

**`backend-use-case`** (test unitaire du use case, in-memory) :
- **Tous les scénarios SAUF les données manquantes.** Les données manquantes sont rejetées par la couche contrôleur/validation avant d'atteindre le use case, donc elles ne sont pas testables à ce niveau.

**`ui`** (test d'intégration UI) :
- **Tous les scénarios.** Chaque branche a un impact visible côté interface (message de succès, message d'erreur, état du formulaire).

**`backend-e2e`** (test end-to-end, vraie infra, HTTP, BDD) :
- Le but du e2e est de couvrir **une fois chaque branche du contrôleur**, pas chaque variation métier. Le contrôleur a typiquement ces branches : succès, erreur métier (toutes les violations de règle passent par le même chemin), données manquantes/invalides (validation request), non trouvé, erreur technique.
- Règles de marquage :
  - **Cas nominal** : toujours `backend-e2e`
  - **Violations de règle métier** : si plusieurs scénarios violent la même règle métier (ex : 2 formats invalides différents), **un seul** est marqué `backend-e2e` (le premier), car les autres empruntent la même branche contrôleur
  - **Données manquantes / invalides** : toujours `backend-e2e` (et jamais `backend-use-case`, car rejeté avant le use case)
  - **Non trouvé** : `backend-e2e` si c'est un type d'erreur distinct dans le contrôleur
  - **Erreur technique** : `backend-e2e`
  - Les autres scénarios du même type ne sont PAS marqués `backend-e2e`

### Étape 5 — Soumettre les scénarios

Appelle l'outil MCP `submit_scenarios` avec :
- `ruleId` : l'ID reçu à l'étape 1
- `scenarios` : tableau de `{ title: string, body: string, testDrivers: string[] }`

Le backend notifie automatiquement le plugin FigJam via WebSocket. Le plugin crée les shapes scénario en enfants de la règle sur le board.

Affiche un résumé des scénarios générés, puis reprends le polling.
