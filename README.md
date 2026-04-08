# Impact Mapping Copilot

A FigJam plugin that transforms impact mapping workshops into structured GitHub backlogs, with AI-powered scenario generation and ubiquitous language consistency analysis, via Claude Code.

## What it does

1. **Analyze** a FigJam board containing an impact mapping (colored shapes connected in a hierarchy)
2. **Create GitHub issues** from the board elements with proper hierarchy, labels, and project assignment
3. **Generate BDD scenarios** for business rules using Claude Code (ATDD-ready, Given/When/Then format)

### Impact Mapping Hierarchy

```
OBJECTIVE → ACTOR → IMPACT → ACTION → USER_STORY → RULE → SCENARIO
```

Each level is represented by a colored shape on the FigJam board:

| Type | Color | Shape |
|------|-------|-------|
| Objective | Blue `#1E3A8A` | Rounded rectangle |
| Actor | Purple `#7C3AED` | Rounded rectangle |
| Impact | Green `#16A34A` | Rounded rectangle |
| Action | Orange `#EA580C` | Rounded rectangle |
| User Story | Yellow `#FACC15` | Rounded rectangle |
| Rule | Slate `#64748B` | Rounded rectangle |
| Scenario | Light slate `#CBD5E1` | Rounded rectangle |

Shapes are connected with FigJam connectors to define the parent-child hierarchy.

## Prerequisites

- Node.js >= 18
- npm >= 9 (workspaces support)
- [Figma desktop app](https://www.figma.com/downloads/) (required to load development plugins)
- A [Figma](https://www.figma.com) account (free tier works)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (for AI scenario generation)

## Installation

```bash
git clone https://github.com/<your-org>/figjam-plugin-from-impact-mapping-to-github-issues.git
cd figjam-plugin-from-impact-mapping-to-github-issues
npm install
```

## Build

```bash
# Build the FigJam plugin
cd apps/figjam-plugin
npm run build

# Build the backend MCP server
cd apps/backend
npm run build
```

## Load the plugin in Figma

1. Open the **Figma desktop app** and create a new FigJam board
2. Go to **Plugins** > **Development** > **Import plugin from manifest...**
3. Select the file `apps/figjam-plugin/manifest.json`
4. The plugin appears under **Plugins** > **Development** > **Impact Mapping Copilot**

## Usage

### Creating an impact mapping board

Open the plugin in FigJam. Use the **"Create element"** buttons to add typed shapes (Objective, Actor, Impact, etc.) to the board. Connect them with FigJam connectors to define the hierarchy.

You can also create shapes manually — the plugin recognizes any `ShapeWithText` (square or rounded rectangle) with the correct fill color.

### Exporting to GitHub Issues

1. Fill in the GitHub configuration in the plugin panel:
   - **GitHub Token**: a [personal access token](https://github.com/settings/tokens) with `repo` and `project` scopes
   - **Owner**: GitHub org or user
   - **Repo**: repository name
   - **Project number**: the GitHub Project (v2) number
2. Click **"Create issues"** to export the full board, or select specific elements and click **"Sync selection"**

### AI Scenario Generation (with Claude Code)

This feature uses Claude Code as an MCP client to generate BDD scenarios for business rules.

#### Setup

1. Build the backend: `cd apps/backend && npm run build`
2. Open Claude Code **from the project root** — it reads `.mcp.json` and starts the MCP server automatically
3. Open the plugin in FigJam (this connects the WebSocket to the backend)

#### Generating scenarios

1. In FigJam, select a **Rule** shape (slate colored)
2. Click **"Generate scenarios for this rule"** in the plugin panel
3. In Claude Code, run the skill: `/wait-scenarios-request`
4. Claude Code polls for requests, retrieves the board context, and generates ATDD-ready scenarios (Given/When/Then with test driver labels)
5. Scenarios appear automatically on the FigJam board as children of the rule

## License

MIT
