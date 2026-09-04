import { ModelRouterEmbeddingModel } from '@mastra/core/llm';
import { LibSQLVector } from '@mastra/libsql';
import { MDocument } from '@mastra/rag';
import { embed, embedMany } from 'ai';
import { dbUrls } from './paths';
import { expensePolicyDocs } from '../mock-data/expense-policy-docs';

export const POLICY_INDEX_NAME = 'expense_policy_chunks';

/** 1536 dimensions is what `text-embedding-3-small` returns. */
const EMBEDDING_DIMENSION = 1536;

/**
 * The embedding model is exposed through the AI SDK's v2 compatibility layer, which logs a
 * warning nobody here can act on. Setup output stays readable without it.
 */
globalThis.AI_SDK_LOG_WARNINGS = false;

export const policyEmbeddingModel = new ModelRouterEmbeddingModel(
  'openai/text-embedding-3-small',
);

export const policyVectorStore = new LibSQLVector({
  id: 'expense-policy-vector-store',
  url: dbUrls.policy,
});

/**
 * Chunks and embeds the policy documents into a local vector index. Embedding costs
 * money and takes a few seconds, so the work is skipped once the index is populated.
 */
export async function ensurePolicyIndex(): Promise<{ chunks: number; created: boolean }> {
  await policyVectorStore.createIndex({
    indexName: POLICY_INDEX_NAME,
    dimension: EMBEDDING_DIMENSION,
  });

  const { count } = await policyVectorStore.describeIndex({ indexName: POLICY_INDEX_NAME });
  if (count > 0) {
    return { chunks: count, created: false };
  }

  const chunks = (
    await Promise.all(
      expensePolicyDocs.map(async doc => {
        const document = MDocument.fromText(doc.text, { title: doc.title, docId: doc.id });
        const docChunks = await document.chunk({
          strategy: 'recursive',
          maxSize: 300,
          overlap: 30,
        });
        return docChunks.map(chunk => ({ ...chunk, docId: doc.id, title: doc.title }));
      }),
    )
  ).flat();

  const { embeddings } = await embedMany({
    model: policyEmbeddingModel,
    values: chunks.map(chunk => chunk.text),
  });

  await policyVectorStore.upsert({
    indexName: POLICY_INDEX_NAME,
    vectors: embeddings,
    metadata: chunks.map(chunk => ({
      text: chunk.text,
      docId: chunk.docId,
      title: chunk.title,
    })),
  });

  return { chunks: chunks.length, created: true };
}

export type PolicyPassage = {
  score: number;
  title: string;
  docId: string;
  text: string;
};

export async function searchPolicy(query: string, topK: number): Promise<PolicyPassage[]> {
  const { embedding } = await embed({ model: policyEmbeddingModel, value: query });

  const results = await policyVectorStore.query({
    indexName: POLICY_INDEX_NAME,
    queryVector: embedding,
    topK,
  });

  return results.map(result => ({
    score: result.score,
    title: String(result.metadata?.title ?? 'Unknown policy'),
    docId: String(result.metadata?.docId ?? 'unknown'),
    text: String(result.metadata?.text ?? ''),
  }));
}
