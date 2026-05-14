import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';

type PostHandler = (body: string, res: ServerResponse) => void;

export type PluginConnection = {
  onPost(path: string, handler: PostHandler): void;
  sendToPlugin(msg: unknown): Promise<void> | void;
  isConnected(): Promise<boolean> | boolean;
  getPort(): number;
  isProxy(): boolean;
  close(): Promise<void>;
};

export async function createPluginConnection(port: number): Promise<PluginConnection> {
  const primary = await tryCreatePrimary(port);
  if (primary) return primary;
  process.stderr.write(`[mcp] Port ${port} déjà utilisé — démarrage en mode proxy\n`);
  return createProxy(port);
}

function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((res) => {
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => res(Buffer.concat(chunks).toString()));
  });
}

function tryCreatePrimary(port: number): Promise<PluginConnection | null> {
  return new Promise((resolve) => {
    let pluginSocket: WebSocket | null = null;
    const postHandlers = new Map<string, PostHandler>();

    const server: Server = createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === 'POST' && req.url) {
        const handler = postHandlers.get(req.url);
        if (handler) {
          const body = await readBody(req);
          handler(body, res);
          return;
        }
      }

      res.writeHead(404);
      res.end();
    });

    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws: WebSocket) => {
      process.stderr.write('[mcp] Plugin FigJam connecté via WebSocket\n');
      pluginSocket = ws;

      ws.on('close', () => {
        process.stderr.write('[mcp] Plugin FigJam déconnecté\n');
        if (pluginSocket === ws) pluginSocket = null;
      });

      ws.on('error', () => {
        if (pluginSocket === ws) pluginSocket = null;
      });
    });

    const onError = (err: NodeJS.ErrnoException): void => {
      if (err.code === 'EADDRINUSE') {
        resolve(null);
        return;
      }
      process.stderr.write(`[mcp] Erreur serveur HTTP: ${err}\n`);
      resolve(null);
    };

    server.once('error', onError);

    server.listen(port, () => {
      server.off('error', onError);
      process.stderr.write(`[mcp] HTTP + WebSocket server listening on port ${port} (primary)\n`);

      const connection: PluginConnection = {
        onPost(path, handler): void {
          postHandlers.set(path, handler);
        },
        sendToPlugin(msg): void {
          if (pluginSocket && pluginSocket.readyState === pluginSocket.OPEN) {
            pluginSocket.send(JSON.stringify(msg));
          }
        },
        isConnected(): boolean {
          return pluginSocket !== null && pluginSocket.readyState === pluginSocket.OPEN;
        },
        getPort(): number {
          return port;
        },
        isProxy(): boolean {
          return false;
        },
        close(): Promise<void> {
          return new Promise((res) => {
            wss.close(() => {
              server.close(() => res());
            });
          });
        },
      };

      resolve(connection);
    });
  });
}

function createProxy(port: number): PluginConnection {
  const base = `http://127.0.0.1:${port}`;

  async function post(path: string, body: unknown): Promise<Response> {
    return fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
  }

  return {
    onPost(): void {
      // no-op: the primary instance handles inbound POSTs from the plugin
    },
    async sendToPlugin(msg): Promise<void> {
      try {
        await post('/__internal/plugin/send', { message: msg });
      } catch (err) {
        process.stderr.write(`[mcp] proxy sendToPlugin failed: ${err}\n`);
      }
    },
    async isConnected(): Promise<boolean> {
      try {
        const r = await post('/__internal/plugin/is-connected', {});
        if (!r.ok) return false;
        const j = (await r.json()) as { connected: boolean };
        return j.connected;
      } catch {
        return false;
      }
    },
    getPort(): number {
      return port;
    },
    isProxy(): boolean {
      return true;
    },
    close(): Promise<void> {
      return Promise.resolve();
    },
  };
}
