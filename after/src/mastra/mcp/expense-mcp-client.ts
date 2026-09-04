import { join } from 'node:path';
import { MCPClient } from '@mastra/mcp';
import { projectRoot } from '../../db/paths';

/**
 * Connects to the three mock services. Each one is a separate process speaking MCP over
 * stdio, which is what makes them stand in for real third-party services: the agent only
 * ever sees a list of tools, not the SQLite databases behind them.
 */

const serverScript = (fileName: string) => join(projectRoot, 'src', 'mcp-servers', fileName);

export const expenseMcpClient = new MCPClient({
  id: 'expense-mcp-client',
  servers: {
    employee: {
      command: 'npx',
      args: ['tsx', serverScript('employee-server.ts')],
    },
    policy: {
      command: 'npx',
      args: ['tsx', serverScript('expense-policy-server.ts')],
    },
    expenseTool: {
      command: 'npx',
      args: ['tsx', serverScript('expense-tool-server.ts')],
    },
  },
  // Building the policy vector index on a cold start takes longer than the default.
  timeout: 120_000,
});
