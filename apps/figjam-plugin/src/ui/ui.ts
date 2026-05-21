const MCP_SERVER_URL = 'http://localhost:3333';

const progressDiv = document.getElementById('progress') as HTMLDivElement;
const selectionInfoDiv = document.getElementById('selectionInfo') as HTMLDivElement;
const generateScenariosBtn = document.getElementById('generateScenariosBtn') as HTMLButtonElement;
const refineIterationBtn = document.getElementById('refineIterationBtn') as HTMLButtonElement;
const clearLogsBtn = document.getElementById('clearLogsBtn') as HTMLButtonElement;

let selectedRuleId: string | null = null;
let selectedRuleTitle: string | null = null;
let selectedSectionName: string | null = null;
let autoClearTimer: ReturnType<typeof setTimeout> | null = null;
let scenarioContextResolve: ((value: { hierarchy: unknown; glossary: unknown } | { error: string }) => void) | null = null;
let iterationContextResolve: ((value: { section: unknown; userStories: unknown } | { error: string }) => void) | null = null;

function clearLogs(): void {
  progressDiv.innerHTML = '';
}

clearLogsBtn.addEventListener('click', clearLogs);

function log(text: string, className?: string): void {
  const entry = document.createElement('div');
  entry.className = 'log-entry' + (className ? ' ' + className : '');
  entry.textContent = text;
  progressDiv.appendChild(entry);
  progressDiv.scrollTop = progressDiv.scrollHeight;

  if (autoClearTimer) clearTimeout(autoClearTimer);
  autoClearTimer = setTimeout(clearLogs, 60_000);
}

function postToPlugin(type: string, payload?: Record<string, unknown>): void {
  parent.postMessage({ pluginMessage: { type, ...payload } }, '*');
}

onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;

  if (msg.type === 'SELECTION_CHANGED') {
    const selectedElementIds = msg.selectedElementIds as string[];
    selectionInfoDiv.textContent = selectedElementIds.length > 0
      ? `${selectedElementIds.length} element${selectedElementIds.length > 1 ? 's' : ''} selectionne${selectedElementIds.length > 1 ? 's' : ''}`
      : '';

    const parent = msg.selectedParent as { id: string; type: string; title: string } | null;
    if (parent && parent.type === 'RULE') {
      selectedRuleId = parent.id;
      selectedRuleTitle = parent.title;
      generateScenariosBtn.disabled = false;
    } else {
      selectedRuleId = null;
      selectedRuleTitle = null;
      generateScenariosBtn.disabled = true;
    }

    const section = msg.selectedSection as { name: string } | null;
    if (section) {
      selectedSectionName = section.name;
      refineIterationBtn.disabled = false;
    } else {
      selectedSectionName = null;
      refineIterationBtn.disabled = true;
    }
  }

  if (msg.type === 'ITERATION_CONTEXT') {
    if (iterationContextResolve) {
      if (msg.success) {
        iterationContextResolve({ section: msg.section, userStories: msg.userStories });
      } else {
        iterationContextResolve({ error: msg.error as string });
      }
      iterationContextResolve = null;
    }
  }

  if (msg.type === 'SCENARIO_CONTEXT') {
    if (scenarioContextResolve) {
      if (msg.success) {
        scenarioContextResolve({ hierarchy: msg.hierarchy, glossary: msg.glossary });
      } else {
        scenarioContextResolve({ error: msg.error as string });
      }
      scenarioContextResolve = null;
    }
  }
};

document.querySelectorAll<HTMLButtonElement>('[data-element-type]').forEach((btn) => {
  btn.addEventListener('click', () => {
    postToPlugin('CREATE_BOARD_ELEMENT', { elementType: btn.dataset.elementType });
  });
});

generateScenariosBtn.addEventListener('click', async () => {
  if (!selectedRuleId || !selectedRuleTitle) return;

  generateScenariosBtn.disabled = true;
  log('Analyse du contexte impact mapping...', 'success');

  const contextResult = await new Promise<{ hierarchy: unknown; glossary: unknown } | { error: string }>((resolve) => {
    scenarioContextResolve = resolve;
    postToPlugin('REQUEST_SCENARIO_CONTEXT', { ruleId: selectedRuleId });
  });

  if ('error' in contextResult) {
    log(`Erreur analyse contexte: ${contextResult.error}`, 'error');
    generateScenariosBtn.disabled = false;
    return;
  }

  log('Demande de generation envoyee a Claude...', 'success');

  fetch(`${MCP_SERVER_URL}/scenario-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ruleId: selectedRuleId,
      ruleTitle: selectedRuleTitle,
      hierarchy: contextResult.hierarchy,
      glossary: contextResult.glossary,
    }),
  }).catch(() => {
    log('Erreur: MCP server non disponible', 'error');
    generateScenariosBtn.disabled = false;
  });
});

refineIterationBtn.addEventListener('click', async () => {
  if (!selectedSectionName) return;

  refineIterationBtn.disabled = true;
  log('Analyse des User Stories de l\'iteration...', 'success');

  const contextResult = await new Promise<{ section: unknown; userStories: unknown } | { error: string }>((resolve) => {
    iterationContextResolve = resolve;
    postToPlugin('REQUEST_ITERATION_CONTEXT', { section: selectedSectionName });
  });

  if ('error' in contextResult) {
    log(`Erreur analyse iteration: ${contextResult.error}`, 'error');
    refineIterationBtn.disabled = false;
    return;
  }

  log('Demande de raffinement envoyee a Claude...', 'success');

  fetch(`${MCP_SERVER_URL}/iteration-refinement-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      section: contextResult.section,
      userStories: contextResult.userStories,
    }),
  }).catch(() => {
    log('Erreur: MCP server non disponible', 'error');
    refineIterationBtn.disabled = false;
  });
});
