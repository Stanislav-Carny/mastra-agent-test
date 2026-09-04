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
import { expenseAgent } from './agents/expense-agent';
import { expenseServerProxies } from './mcp/expense-service';
import { approvalRouteTool } from './tools/approval-route-tool';
import { expenseWorkflow } from './workflows/expense-workflow';

/**
 * Everything the workshop builds is registered here. Anything missing from this file
 * does not appear in Mastra Studio, which is the most common reason a newly created
 * agent, tool, or workflow seems to have vanished.
 */
export const mastra = new Mastra({
  agents: { expenseAgent },
  tools: { approvalRouteTool },
  workflows: { expenseWorkflow },
  // Surfaces the three mock services in Studio's MCP Servers tab.
  mcpServers: { ...expenseServerProxies },
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
