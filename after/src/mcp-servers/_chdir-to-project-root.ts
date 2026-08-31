import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

// MCPClient spawns these scripts with a working directory that isn't the project root
// (it varies between `mastra dev` and a built app), so relative DB paths and dotenv's
// default .env lookup break unless we anchor cwd here first, before any other import runs.
process.chdir(findProjectRoot(dirname(fileURLToPath(import.meta.url))));
