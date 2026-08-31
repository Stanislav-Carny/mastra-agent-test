import './_chdir-to-project-root';
import 'dotenv/config';
import { LibSQLVector } from '@mastra/libsql';
import { ModelRouterEmbeddingModel } from '@mastra/core/llm';
import { createTool } from '@mastra/core/tools';
import { MCPServer } from '@mastra/mcp';
import { MDocument } from '@mastra/rag';
import { embedMany, embed } from 'ai';
import { z } from 'zod';
import { expensePolicyDocs } from '../mock-data/expense-policy-docs';

const INDEX_NAME = 'expense_policy_chunks';
const embeddingModel = new ModelRouterEmbeddingModel('openai/text-embedding-3-small');

const vectorStore = new LibSQLVector({
  id: 'expense-policy-vector-store',
  url: 'file:./src/mock-data/expense-policy.db',
});

await vectorStore.createIndex({ indexName: INDEX_NAME, dimension: 1536 });

const { count } = await vectorStore.describeIndex({ indexName: INDEX_NAME });
if (count === 0) {
  const chunks = (
    await Promise.all(
      expensePolicyDocs.map(async (doc) => {
        const document = MDocument.fromText(doc.text, { title: doc.title, docId: doc.id });
        const docChunks = await document.chunk({ strategy: 'recursive', maxSize: 300, overlap: 30 });
        return docChunks.map((chunk) => ({ ...chunk, docId: doc.id, title: doc.title }));
      }),
    )
  ).flat();

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks.map((chunk) => chunk.text),
  });

  await vectorStore.upsert({
    indexName: INDEX_NAME,
    vectors: embeddings,
    metadata: chunks.map((chunk) => ({ text: chunk.text, docId: chunk.docId, title: chunk.title })),
  });
}

const searchExpensePolicyTool = createTool({
  id: 'search_expense_policy',
  description: 'Semantic search over expense policy documents. Returns the most relevant policy passages for a question.',
  inputSchema: z.object({
    query: z.string().describe('Natural language question about expense policy'),
    topK: z.number().int().min(1).max(10).default(3),
  }),
  execute: async ({ query, topK }) => {
    const { embedding } = await embed({ model: embeddingModel, value: query });
    const results = await vectorStore.query({ indexName: INDEX_NAME, queryVector: embedding, topK });
    return results.map((result) => ({
      score: result.score,
      title: result.metadata?.title,
      text: result.metadata?.text,
    }));
  },
});

const server = new MCPServer({
  id: 'expense-policy-knowledge-base',
  name: 'Expense Policy Knowledge Base',
  version: '1.0.0',
  description: 'Mock knowledge base service for expense policy documents (RAG-backed)',
  tools: { searchExpensePolicyTool },
});

await server.startStdio();
