import { createHash } from "node:crypto";

/** Stable Qdrant point id from file path + chunk index. Same chunk → same id on re-ingest. */
export function pointIdForChunk(source: string, chunkIndex: number): string {
  const hex = createHash("sha256").update(`v1:${source}:${String(chunkIndex)}`).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `8${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}
