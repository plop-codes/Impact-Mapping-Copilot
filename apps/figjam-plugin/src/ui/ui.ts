import type { HierarchizedElementJson } from '../modules/boardAnalysis/impactMapping';
import type { GlossaryEntry } from '../modules/boardAnalysis/analyzeContextElements/contextElements';
import { CreateGitHubIssuesUseCase } from '../modules/issueCreation/createGitHubIssues/createGitHubIssues.useCase';
import { FetchGithubIssueCreator } from '../modules/issueCreation/createGitHubIssues/createGitHubIssues.fetchGithubIssueCreator';
import { FetchGithubImageUploader } from '../modules/issueCreation/createGitHubIssues/createGitHubIssues.fetchGithubImageUploader';
import type { ImageAttachment } from '../modules/issueCreation/createGitHubIssues/githubImageUploader';

let hierarchizedElements: HierarchizedElementJson[] = [];
let attachmentsByElementId: Record<string, ImageAttachment[]> = {};
let productVision: string[] | undefined;
let operationalActors: string[] | undefined;
let glossary: GlossaryEntry[] | undefined;
let selectedElementIds: string[] = [];
let boardDataRefreshResolve: (() => void) | null = null;

const MCP_SERVER_URL = 'http://localhost:3333';
const MCP_WS_URL = 'ws://localhost:3333';

function sendToMcpServer(data: {
  elements: HierarchizedElementJson[];
  warnings: string[];
  productVision?: string[];
  operationalActors?: string[];
  glossary?: GlossaryEntry[];
}): void {
  fetch(`${MCP_SERVER_URL}/board-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {
    // MCP server not running — silently ignore
  });
}

function connectMcpWebSocket(): void {
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function connect(): void {
    try {
      ws = new WebSocket(MCP_WS_URL);
    } catch {
      scheduleReconnect();
      return;
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === 'REFRESH') {
          postToPlugin('REQUEST_BOARD_DATA');
        }
        if (msg.type === 'SCENARIOS_GENERATED') {
          postToPlugin('CREATE_SCENARIOS', {
            ruleId: msg.ruleId,
            scenarios: msg.scenarios,
          });
          generateScenariosBtn.disabled = false;
          log(`${msg.scenarios.length} scénarios générés par Claude`, 'success');
        }
      } catch {
        // Invalid message, ignore
      }
    };

    ws.onclose = () => {
      ws = null;
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  function scheduleReconnect(): void {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, 5000);
  }

  connect();
}

connectMcpWebSocket();

const tokenInput = document.getElementById('token') as HTMLInputElement;
const ownerInput = document.getElementById('owner') as HTMLInputElement;
const repoInput = document.getElementById('repo') as HTMLInputElement;
const projectNumberInput = document.getElementById('projectNumber') as HTMLInputElement;
const createBtn = document.getElementById('createBtn') as HTMLButtonElement;
const progressDiv = document.getElementById('progress') as HTMLDivElement;
const syncSelectedBtn = document.getElementById('syncSelectedBtn') as HTMLButtonElement;
const selectionInfoDiv = document.getElementById('selectionInfo') as HTMLDivElement;
const generateScenariosBtn = document.getElementById('generateScenariosBtn') as HTMLButtonElement;
const clearLogsBtn = document.getElementById('clearLogsBtn') as HTMLButtonElement;

let selectedRuleId: string | null = null;
let selectedRuleTitle: string | null = null;
let autoClearTimer: ReturnType<typeof setTimeout> | null = null;

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

  if (msg.type === 'LOAD_CONFIG' && msg.config) {
    tokenInput.value = msg.config.token || '';
    ownerInput.value = msg.config.owner || '';
    repoInput.value = msg.config.repo || '';
    projectNumberInput.value = msg.config.projectNumber || '';
  }

  if (msg.type === 'SELECTION_CHANGED') {
    selectedElementIds = msg.selectedElementIds as string[];
    const count = selectedElementIds.length;
    syncSelectedBtn.disabled = count === 0;
    selectionInfoDiv.textContent = count > 0
      ? `${count} élément${count > 1 ? 's' : ''} sélectionné${count > 1 ? 's' : ''}`
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
  }

  if (msg.type === 'BOARD_DATA') {
    hierarchizedElements = msg.elements;
    if (boardDataRefreshResolve) {
      boardDataRefreshResolve();
      boardDataRefreshResolve = null;
    }
    if (msg.attachments) {
      const raw = msg.attachments as Record<string, { name: string; bytes: number[] }[]>;
      attachmentsByElementId = {};
      for (const [elementId, items] of Object.entries(raw)) {
        attachmentsByElementId[elementId] = items.map((item) => ({
          name: item.name,
          bytes: new Uint8Array(item.bytes),
        }));
      }
    }
    productVision = msg.productVision;
    operationalActors = msg.operationalActors;
    glossary = msg.glossary;
    if (msg.warnings) {
      for (const warning of msg.warnings) {
        log(`⚠ ${warning}`, 'error');
      }
    }

    sendToMcpServer({
      elements: hierarchizedElements,
      warnings: msg.warnings ?? [],
      productVision,
      operationalActors,
      glossary,
    });
  }
};

createBtn.addEventListener('click', async () => {
  const token = tokenInput.value.trim();
  const owner = ownerInput.value.trim();
  const repo = repoInput.value.trim();
  const projectNumber = parseInt(projectNumberInput.value, 10);

  if (!token || !owner || !repo || !projectNumber) {
    log('Veuillez remplir tous les champs.', 'error');
    return;
  }

  createBtn.disabled = true;
  progressDiv.innerHTML = '';

  const config = { token, owner, repo, projectNumber };
  postToPlugin('SAVE_CONFIG', { config });

  const imageUploader = new FetchGithubImageUploader(config, fetch.bind(window));
  const creator = new FetchGithubIssueCreator(config, fetch.bind(window), log, imageUploader);
  const useCase = new CreateGitHubIssuesUseCase(creator);
  const result = await useCase.execute(hierarchizedElements, attachmentsByElementId);

  await creator.updateProjectReadme(productVision, operationalActors, glossary);

  if (result.isSuccess()) {
    postToPlugin('DONE');
  } else {
    log(`Erreur: ${result.getError()}`, 'error');
    postToPlugin('ERROR', { error: result.getError() });
  }

  createBtn.disabled = false;
});

syncSelectedBtn.addEventListener('click', async () => {
  const token = tokenInput.value.trim();
  const owner = ownerInput.value.trim();
  const repo = repoInput.value.trim();
  const projectNumber = parseInt(projectNumberInput.value, 10);

  if (!token || !owner || !repo || !projectNumber) {
    log('Veuillez remplir tous les champs.', 'error');
    return;
  }

  if (selectedElementIds.length === 0) {
    log('Aucun élément sélectionné.', 'error');
    return;
  }

  syncSelectedBtn.disabled = true;
  progressDiv.innerHTML = '';

  const config = { token, owner, repo, projectNumber };
  postToPlugin('SAVE_CONFIG', { config });

  await new Promise<void>((resolve) => {
    boardDataRefreshResolve = resolve;
    postToPlugin('REQUEST_BOARD_DATA');
  });

  const imageUploader = new FetchGithubImageUploader(config, fetch.bind(window));
  const creator = new FetchGithubIssueCreator(config, fetch.bind(window), log, imageUploader);
  const useCase = new CreateGitHubIssuesUseCase(creator);
  const result = await useCase.execute(hierarchizedElements, attachmentsByElementId, selectedElementIds);

  if (result.isSuccess()) {
    log('Synchronisation terminée.', 'success');
  } else {
    log(`Erreur: ${result.getError()}`, 'error');
    postToPlugin('ERROR', { error: result.getError() });
  }

  syncSelectedBtn.disabled = false;
});

document.querySelectorAll<HTMLButtonElement>('[data-element-type]').forEach((btn) => {
  btn.addEventListener('click', () => {
    postToPlugin('CREATE_BOARD_ELEMENT', { elementType: btn.dataset.elementType });
  });
});

generateScenariosBtn.addEventListener('click', async () => {
  if (!selectedRuleId || !selectedRuleTitle) return;

  generateScenariosBtn.disabled = true;
  log('Rafraîchissement du board...', 'success');

  await new Promise<void>((resolve) => {
    boardDataRefreshResolve = resolve;
    postToPlugin('REQUEST_BOARD_DATA');
  });

  log('Demande de génération envoyée à Claude...', 'success');

  fetch(`${MCP_SERVER_URL}/scenario-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ruleId: selectedRuleId, ruleTitle: selectedRuleTitle }),
  }).catch(() => {
    log('Erreur: MCP server non disponible', 'error');
    generateScenariosBtn.disabled = false;
  });
});
