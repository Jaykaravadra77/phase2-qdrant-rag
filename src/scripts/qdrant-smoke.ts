import { env } from "../config/env.js";
import { EMBEDDING_VECTOR_SIZE, createQdrantClient, ensureCollection } from "../services/qdrant.service.js";

const SMOKE_POINT_ID = "00000000-0000-4000-8000-000000000001";

function unitVector(): number[] {
  const vector = new Array<number>(EMBEDDING_VECTOR_SIZE).fill(0);
  vector[0] = 1;
  return vector;
}

const client = createQdrantClient();
const collection = env.QDRANT_COLLECTION;
const vector = unitVector();

await ensureCollection(client);

await client.upsert(collection, {
  wait: true,
  points: [
    {
      id: SMOKE_POINT_ID,
      vector,
      payload: { source: "smoke", chunkIndex: 0, text: "qdrant smoke test" },
    },
  ],
});

const { points } = await client.query(collection, {
  query: vector,
  limit: 1,
  with_payload: true,
});

const top = points[0];
if (!top || String(top.id) !== SMOKE_POINT_ID) {
  throw new Error(`Smoke search missed the upserted point. Got: ${JSON.stringify(points)}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      qdrantUrl: env.QDRANT_URL,
      collection,
      vectorSize: EMBEDDING_VECTOR_SIZE,
      embeddingModel: env.GEMINI_EMBEDDING_MODEL,
      hitId: top.id,
      score: top.score,
      payload: top.payload,
    },
    null,
    2,
  ),
);
