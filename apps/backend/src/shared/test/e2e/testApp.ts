import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPluginConnection, type PluginConnection } from '../../pluginConnection.js';
import { GenerateScenariosModule } from '../../../generateScenarios/generateScenarios.module.js';

export class TestApp {
  private static sharedInstance: TestApp | null = null;

  private constructor(
    private readonly connection: PluginConnection,
    private readonly mcpClient: Client,
    private readonly mcpServer: McpServer,
  ) {}

  static async startShared(): Promise<TestApp> {
    if (!TestApp.sharedInstance) {
      TestApp.sharedInstance = await TestApp.start();
    }
    return TestApp.sharedInstance;
  }

  static async cleanupShared(): Promise<void> {
    if (TestApp.sharedInstance) {
      await TestApp.sharedInstance.cleanup();
      TestApp.sharedInstance = null;
    }
  }

  private static async start(): Promise<TestApp> {
    const connection = await createPluginConnection(0);

    const mcpServer = new McpServer({
      name: 'impact-mapping-copilot-test',
      version: '0.1.0',
    });

    new GenerateScenariosModule(mcpServer, connection);

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await mcpServer.connect(serverTransport);

    const mcpClient = new Client({ name: 'test-client', version: '0.1.0' });
    await mcpClient.connect(clientTransport);

    return new TestApp(connection, mcpClient, mcpServer);
  }

  get httpBaseUrl(): string {
    return `http://localhost:${this.connection.getPort()}`;
  }

  async callMcpTool(name: string, args: Record<string, unknown> = {}): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    const result = await this.mcpClient.callTool({ name, arguments: args });
    return result as { content: Array<{ type: string; text: string }>; isError?: boolean };
  }

  async reset(): Promise<void> {
    await fetch(`${this.httpBaseUrl}/__internal/scenario-request/clear`, { method: 'POST' });
  }

  private async cleanup(): Promise<void> {
    await this.reset();
    await this.mcpClient.close();
    await this.mcpServer.close();
    await this.connection.close();
  }
}
