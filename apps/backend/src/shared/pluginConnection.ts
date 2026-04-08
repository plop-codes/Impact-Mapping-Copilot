import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';

type PostHandler = (body: string, res: ServerResponse) => void;

export type PluginConnection = {
  onPost(path: string, handler: PostHandler): void;
  sendToPlugin(msg: unknown): void;
  isConnected(): boolean;
  getPort(): number;
  close(): Promise<void>;
};

export function createPluginConnection(port: number): Promise<PluginConnection> {
  return new Promise((resolve) => {
    let pluginSocket: WebSocket | null = null;
    const postHandlers = new Map<string, PostHandler>();

    function readBody(req: IncomingMessage): Promise<string> {
      const chunks: Buffer[] = [];
      return new Promise((res) => {
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => res(Buffer.concat(chunks).toString()));
      });
    }

    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
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

    server.listen(port, () => {
      const addr = server.address();
      const actualPort = typeof addr === 'object' && addr ? addr.port : port;
      process.stderr.write(`[mcp] HTTP + WebSocket server listening on port ${actualPort}\n`);

      resolve({
        onPost(path: string, handler: PostHandler): void {
          postHandlers.set(path, handler);
        },

        sendToPlugin(msg: unknown): void {
          if (pluginSocket && pluginSocket.readyState === pluginSocket.OPEN) {
            pluginSocket.send(JSON.stringify(msg));
          }
        },

        isConnected(): boolean {
          return pluginSocket !== null && pluginSocket.readyState === pluginSocket.OPEN;
        },

        getPort(): number {
          return actualPort;
        },

        close(): Promise<void> {
          return new Promise((res) => {
            wss.close(() => {
              server.close(() => res());
            });
          });
        },
      });
    });
  });
}
