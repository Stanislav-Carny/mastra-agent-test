import { join } from 'node:path';
import { config } from 'dotenv';
import { projectRoot } from '../db/paths';

/**
 * MCP stdio servers run as subprocesses that do not inherit the parent's environment
 * beyond a small whitelist, and their working directory is not the project root. Both
 * of those break dotenv's default lookup, so the `.env` path is resolved explicitly.
 *
 * Import this first in every MCP server, before anything that reads an API key.
 */
config({ path: join(projectRoot, '.env'), quiet: true });
