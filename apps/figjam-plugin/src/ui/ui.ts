import type { HierarchizedElementJson } from '../modules/boardAnalysis/impactMapping';

let hierarchizedElements: HierarchizedElementJson[] = [];
let selectedElementIds: string[] = [];
let boardDataRefreshResolve: (() => void) | null = null;

const MCP_SERVER_URL = 'http://localhost:3333';
const MCP_WS_URL = 'ws://localhost:3333';

function sendToMcpServer(data: {
  elements: HierarchizedElementJson[];
  warnings: string[];
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

const progressDiv = document.getElementById('progress') as HTMLDivElement;
const selectionInfoDiv = document.getElementById('selectionInfo') as HTMLDivElement;
const generateScenariosBtn = document.getElementById('generateScenariosBtn') as HTMLButtonElement;
const clearLogsBtn = document.getElementById('clearLogsBtn') as HTMLButtonElement;

let selectedRuleId: string | null = null;
let selectedRuleTitle: string | null = null;
let autoClearTimer: ReturnType<typeof setTimeout> | null = null;
let scenarioContextResolve: ((value: { hierarchy: unknown; glossary: unknown } | { error: string }) => void) | null = null;

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
    selectedElementIds = msg.selectedElementIds as string[];
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
  }

  if (msg.type === 'BOARD_DATA') {
    hierarchizedElements = msg.elements;
    if (boardDataRefreshResolve) {
      boardDataRefreshResolve();
      boardDataRefreshResolve = null;
    }
    if (msg.warnings) {
      for (const warning of msg.warnings) {
        log(`! ${warning}`, 'error');
      }
    }

    sendToMcpServer({
      elements: hierarchizedElements,
      warnings: msg.warnings ?? [],
    });
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
