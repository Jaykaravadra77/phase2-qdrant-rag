import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "../config/env.js";

/**
 * Vector size for `gemini-embedding-001` default API output (3072).
 * Google docs: Gemini Embedding GA; MRL can shrink this (768 / 1536) only if
 * you pass `output_dimensionality` on every embed. We do not — so the
 * collection must be 3072. A different model or dim needs a new collection.
 */
export const EMBEDDING_VECTOR_SIZE = 3072;

export function createQdrantClient(): QdrantClient {
  return new QdrantClient({ url: env.QDRANT_URL });
}

function namedVectorSize(vectors: unknown): number | undefined {
  if (vectors && typeof vectors === "object" && "size" in vectors) {
    const size = (vectors as { size?: unknown }).size;
    return typeof size === "number" ? size : undefined;
  }
  return undefined;
}

export async function ensureCollection(client: QdrantClient): Promise<void> {
  const name = env.QDRANT_COLLECTION;
  const { exists } = await client.collectionExists(name);

  if (exists) {
    const info = await client.getCollection(name);
    const size = namedVectorSize(info.config?.params?.vectors);
    if (size !== EMBEDDING_VECTOR_SIZE) {
      throw new Error(
        `Collection "${name}" has vector size ${String(size)}, expected ${EMBEDDING_VECTOR_SIZE} for ${env.GEMINI_EMBEDDING_MODEL}. Delete the collection or pick a new QDRANT_COLLECTION.`,
      );
    }
    return;
  }

  await client.createCollection(name, {
    vectors: { size: EMBEDDING_VECTOR_SIZE, distance: "Cosine" },
  });
}

export type RetrievedChunk = {
  source: string;
  chunkIndex: number;
  text: string;
  score: number;
};

export async function searchSimilarChunks(vector: number[], limit: number): Promise<RetrievedChunk[]> {
  const client = createQdrantClient();
  const { points } = await client.query(env.QDRANT_COLLECTION, {
    query: vector,
    limit,
    with_payload: true,
  });

  const chunks: RetrievedChunk[] = [];
  for (const point of points) {
    const payload = point.payload;
    if (!payload || typeof payload !== "object") {
      continue;
    }
    const source = payload.source;
    const chunkIndex = payload.chunkIndex;
    const text = payload.text;
    if (typeof source !== "string" || typeof chunkIndex !== "number" || typeof text !== "string") {
      continue;
    }
    chunks.push({
      source,
      chunkIndex,
      text,
      score: point.score ?? 0,
    });
  }
  return chunks;
}
