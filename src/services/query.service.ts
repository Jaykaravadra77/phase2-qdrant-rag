import { AppError } from "../lib/errors.js";
import { queryModelOutputSchema } from "../schemas/rag.schema.js";
import { embedTexts, generateJson } from "./gemini.service.js";
import { searchSimilarChunks, type RetrievedChunk } from "./qdrant.service.js";

export const TOP_K = 5;

const SYSTEM_PROMPT = `You answer questions using ONLY the provided chunks.
If the chunks do not contain the answer, say you do not know.
Never invent sources, file names, or chunk indexes.
Citations must use source and chunkIndex from the provided chunks only.
Output strictly valid JSON: { "answer": string, "citations": [{ "source": string, "chunkIndex": number, "quote"?: string }] }
No markdown fences.`;

export async function queryDocs(question: string): Promise<{
  answer: string;
  citations: Array<{ source: string; chunkIndex: number; quote?: string }>;
  retrieved: Array<{ source: string; chunkIndex: number; score: number }>;
  usage?: { promptTokens?: number; candidatesTokens?: number; totalTokens?: number };
}> {
  const [questionVector] = await embedTexts([question], "RETRIEVAL_QUERY");
  if (!questionVector) {
    throw new AppError("Failed to embed question", 502);
  }

  const retrieved = await searchSimilarChunks(questionVector, TOP_K);
  if (retrieved.length === 0) {
    return {
      answer: "I do not know. No matching chunks were found in the docs.",
      citations: [],
      retrieved: [],
    };
  }

  const { rawText, usage } = await generateJson(SYSTEM_PROMPT, buildUserPrompt(question, retrieved));
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new AppError("Model returned invalid JSON", 502);
  }

  const modelOut = queryModelOutputSchema.parse(parsed);
  const citations = filterCitationsToRetrieved(modelOut.citations, retrieved);

  return {
    answer: modelOut.answer,
    citations,
    retrieved: retrieved.map((chunk) => ({
      source: chunk.source,
      chunkIndex: chunk.chunkIndex,
      score: chunk.score,
    })),
    usage,
  };
}

function buildUserPrompt(question: string, chunks: RetrievedChunk[]): string {
  const chunkBlock = chunks
    .map(
      (chunk, index) =>
        `[${String(index)}] source=${chunk.source} chunkIndex=${String(chunk.chunkIndex)}\n${chunk.text}`,
    )
    .join("\n\n");

  return `Question:\n${question}\n\nChunks:\n${chunkBlock}`;
}

function filterCitationsToRetrieved(
  citations: Array<{ source: string; chunkIndex: number; quote?: string }>,
  retrieved: RetrievedChunk[],
): Array<{ source: string; chunkIndex: number; quote?: string }> {
  const allowed = new Set(retrieved.map((chunk) => `${chunk.source}:${String(chunk.chunkIndex)}`));
  return citations.filter((citation) => allowed.has(`${citation.source}:${String(citation.chunkIndex)}`));
}
