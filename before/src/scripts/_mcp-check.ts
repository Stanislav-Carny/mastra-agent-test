import '../mcp-servers/_load-env';
import { join } from 'node:path';
import { MCPClient } from '@mastra/mcp';
import { projectRoot } from '../db/paths';

/**
 * Connects to the three mock services, then prints a single JSON line describing the
 * result. `verify.ts` runs this as a child process because shutting down MCP stdio
 * subprocesses always logs a "Connection closed" error, even on success, and that noise
 * would bury the verification report.
 */

const mcpServer = (fileName: string) => ({
  command: 'npx',
  args: ['tsx', join(projectRoot, 'src', 'mcp-servers', fileName)],
  enableServerLogs: false,
});

const mcpClient = new MCPClient({
  id: 'workshop-mcp-check',
  servers: {
    employee: mcpServer('employee-server.ts'),
    policy: mcpServer('expense-policy-server.ts'),
    expenseTool: mcpServer('expense-tool-server.ts'),
  },
  timeout: 120_000,
});

let result: { ok: boolean; toolCount: number; toolNames: string[]; errors: Record<string, string> };

try {
  const { tools, errors } = await mcpClient.listToolsWithErrors();
  result = {
    ok: Object.keys(errors).length === 0,
    toolCount: Object.keys(tools).length,
    toolNames: Object.keys(tools),
    errors: Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, String(v)])),
  };
} catch (error) {
  result = {
    ok: false,
    toolCount: 0,
    toolNames: [],
    errors: { client: error instanceof Error ? error.message : String(error) },
  };
}

// Prefixed so `verify.ts` can pick this line out of any surrounding log output.
console.log(`__MCP_CHECK__${JSON.stringify(result)}`);

await mcpClient.disconnect().catch(() => {});
process.exit(0);
