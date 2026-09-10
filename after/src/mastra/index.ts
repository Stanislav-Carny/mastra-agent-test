import { Mastra } from '@mastra/core/mastra';
import { MastraCompositeStore } from '@mastra/core/storage';
import { DuckDBStore } from '@mastra/duckdb';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import {
  MastraPlatformExporter,
  MastraStorageExporter,
  Observability,
  SensitiveDataFilter,
} from '@mastra/observability';
import { setupCheckAgent } from './agents/setup-check-agent';

/**
 * This file is the registry for the whole project. If something you build is not listed
 * here, it will not show up in Mastra Studio, no matter how correct the code is.
 *
 * You will add four things to this file during the workshop:
 *
 *   tools:      { approvalRouteTool }        <- docs/02-build-the-tool.md
 *   mcpServers: { ...expenseServerProxies }  <- docs/03-connect-mcp.md
 *   agents:     { expenseAgent }             <- docs/04-agent-and-skill.md
 *   workflows:  { expenseWorkflow }          <- docs/05-approval-workflow.md
 *
 * The storage, logger, and observability config below is already done. Leave it alone.
 */
export const mastra = new Mastra({
  agents: { setupCheckAgent },
  bundler: {
    externals: ['@duckdb/node-bindings'],
  },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: 'mastra-storage',
      // Holds workflow snapshots, so a suspended run survives a dev-server restart.
      url: process.env.TURSO_DATABASE_URL || 'file:./mastra.db',
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    }),
    domains: {
      observability: await new DuckDBStore().getStore('observability'),
    },
  }),
  logger: new PinoLogger({ name: 'Mastra', level: 'info' }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'expense-assistant',
        exporters: [
          new MastraStorageExporter(),
          // Only active when MASTRA_PLATFORM_ACCESS_TOKEN is set.
          new MastraPlatformExporter(),
        ],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});
