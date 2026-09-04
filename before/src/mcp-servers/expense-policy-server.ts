import './_load-env';
import { createTool } from '@mastra/core/tools';
import { MCPServer } from '@mastra/mcp';
import { z } from 'zod';
import { ensurePolicyIndex, searchPolicy } from '../db/policy-index';

await ensurePolicyIndex();

const searchExpensePolicy = createTool({
  id: 'searchExpensePolicy',
  description:
    'Semantic search over the company expense policy documents. Returns the most relevant policy passages, each with the title of the document it came from.',
  inputSchema: z.object({
    query: z.string().describe('Natural language question about expense policy'),
    topK: z.number().int().min(1).max(10).default(3).describe('How many passages to return'),
  }),
  // MCP requires a tool's structured result to be an object, so the passages are
  // returned under a key rather than as a bare array.
  outputSchema: z.object({
    passages: z.array(
      z.object({
        score: z.number(),
        title: z.string(),
        docId: z.string(),
        text: z.string(),
      }),
    ),
  }),
  mcp: {
    annotations: { title: 'Search expense policy', readOnlyHint: true, destructiveHint: false },
  },
  execute: async ({ query, topK }) => {
    return { passages: await searchPolicy(query, topK) };
  },
});

const server = new MCPServer({
  id: 'expense-policy-knowledge-base',
  name: 'Expense Policy Knowledge Base',
  version: '1.0.0',
  description:
    'Mock knowledge base service for expense policy documents, backed by a local SQLite vector index',
  tools: { searchExpensePolicy },
});

await server.startStdio();
