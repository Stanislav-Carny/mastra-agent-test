import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { MCPClient } from '@mastra/mcp';

function findProjectRoot(startDir: string): string {
  let dir = startDir;
  while (!existsSync(join(dir, 'package.json'))) {
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(`Could not locate project root (package.json) above ${startDir}`);
    }
    dir = parent;
  }
  return dir;
}

// mastra dev/build run this module from varying working directories (e.g. src/mastra/public
// during dev, .mastra/output during a built app), so MCP server script paths are resolved
// relative to the actual project root rather than process.cwd().
const projectRoot = findProjectRoot(process.cwd());
const serverScript = (name: string) => join(projectRoot, 'src', 'mcp-servers', name);

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
});
