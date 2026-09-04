import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Resolves the project directory, which every database path is built from.
 *
 * This needs more care than it looks. `mastra dev` bundles the app into `.mastra/output`,
 * so the running module is not where the source lives; MCP servers are spawned as
 * subprocesses with their own working directory; and scripts get run from both the
 * project directory and the repository root. A `package.json` alone is not a reliable
 * marker, because the bundled output has one too.
 *
 * So we look for a directory that has both a `package.json` and a `src/mcp-servers`
 * folder, starting from the working directory and falling back to this module's location.
 */
function isProjectRoot(dir: string): boolean {
  return existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'src', 'mcp-servers'));
}

function searchUpwards(startDir: string): string | undefined {
  let dir = startDir;
  while (!isProjectRoot(dir)) {
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
  return dir;
}

export function findProjectRoot(): string {
  const fromCwd = searchUpwards(process.cwd());
  if (fromCwd) return fromCwd;

  const fromModule = searchUpwards(dirname(fileURLToPath(import.meta.url)));
  if (fromModule) return fromModule;

  throw new Error(
    `Could not locate the project directory from ${process.cwd()}. ` +
      'Run npm scripts from inside before/ or after/.',
  );
}

export const projectRoot = findProjectRoot();

const mockDataDir = join(projectRoot, 'src', 'mock-data');

export const dbFiles = {
  employees: join(mockDataDir, 'employees.db'),
  expenses: join(mockDataDir, 'expenses.db'),
  policy: join(mockDataDir, 'expense-policy.db'),
} as const;

export const dbUrls = {
  employees: `file:${dbFiles.employees}`,
  expenses: `file:${dbFiles.expenses}`,
  policy: `file:${dbFiles.policy}`,
} as const;
