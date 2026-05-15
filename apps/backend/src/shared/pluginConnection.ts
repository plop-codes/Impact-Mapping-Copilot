import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';

type PostHandler = (body: string, res: ServerResponse) => void;

export type PluginConnection = {
  onPost(path: string, handler: PostHandler): void;
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
      process.stderr.write(`[mcp] HTTP server listening on port ${port} (primary)\n`);

      const connection: PluginConnection = {
        onPost(path, handler): void {
          postHandlers.set(path, handler);
        },
        getPort(): number {
          return (server.address() as { port: number }).port;
        },
        isProxy(): boolean {
          return false;
        },
        close(): Promise<void> {
          return new Promise((res) => {
            server.close(() => res());
          });
        },
      };

      resolve(connection);
    });
  });
}

function createProxy(port: number): PluginConnection {
  return {
    onPost(): void {
      // no-op: the primary instance handles inbound POSTs from the plugin
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
