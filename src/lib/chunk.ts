export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 200;

export interface Chunk {
  text: string;
  source: string;
  chunkIndex: number;
}

export function chunkText(text: string, source: string): Chunk[] {
  if (CHUNK_OVERLAP >= CHUNK_SIZE) {
    throw new Error("CHUNK_OVERLAP must be smaller than CHUNK_SIZE");
  }

  if (!text || text.trim() === "") {
    return [];
  }

  const chunks: Chunk[] = [];
  const step = CHUNK_SIZE - CHUNK_OVERLAP;
  let i = 0;
  let chunkIndex = 0;

  while (i < text.length) {
    chunks.push({
      text: text.slice(i, i + CHUNK_SIZE),
      source,
      chunkIndex,
    });
    chunkIndex += 1;
    i += step;
  }

  return chunks;
}
