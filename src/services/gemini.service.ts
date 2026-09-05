import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";
import { EMBEDDING_VECTOR_SIZE } from "./qdrant.service.js";

const EMBED_BATCH_SIZE = 16;
const EMBED_TIMEOUT_MS = 30_000;

type EmbedBatchResponse = {
  embeddings?: Array<{ values?: number[] }>;
};

export async function embedTexts(texts: string[], taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"): Promise<number[][]> {
  const vectors: number[][] = [];

  for (let start = 0; start < texts.length; start += EMBED_BATCH_SIZE) {
    const batch = texts.slice(start, start + EMBED_BATCH_SIZE);
    const embedded = await embedBatch(batch, taskType);
    vectors.push(...embedded);
  }

  return vectors;
}

async function embedBatch(texts: string[], taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"): Promise<number[][]> {
  const model = env.GEMINI_EMBEDDING_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model: `models/${model}`,
        content: { parts: [{ text }] },
        taskType,
      })),
    }),
    signal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new AppError("Embedding request failed", 502, true);
  }

  const payload = (await response.json()) as EmbedBatchResponse;
  const embeddings = payload.embeddings;
  if (!embeddings || embeddings.length !== texts.length) {
    throw new AppError("Embedding response was incomplete", 502, true);
  }

  return embeddings.map((item) => {
    const values = item.values;
    if (!values || values.length !== EMBEDDING_VECTOR_SIZE) {
      throw new AppError(
        `Embedding size was ${String(values?.length)}, expected ${EMBEDDING_VECTOR_SIZE}`,
        502,
        true,
      );
    }
    return values;
  });
}

type GenerateContentResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
};

async function fetchGenerate(url: string, body: string): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY,
    },
    body,
    signal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
  });
}

export async function generateJson(systemInstruction: string, userText: string): Promise<{
  rawText: string;
  usage?: { promptTokens?: number; candidatesTokens?: number; totalTokens?: number };
}> {
  const model = env.GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  });

  let response = await fetchGenerate(url, body);
  if (response.status === 429 || response.status === 503) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    response = await fetchGenerate(url, body);
  }

  if (!response.ok) {
    throw new AppError(`Generation request failed (${String(response.status)})`, 502, true);
  }

  const payload = (await response.json()) as GenerateContentResponse;
  const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new AppError("Generation response was empty", 502, true);
  }

  return {
    rawText,
    usage: {
      promptTokens: payload.usageMetadata?.promptTokenCount,
      candidatesTokens: payload.usageMetadata?.candidatesTokenCount,
      totalTokens: payload.usageMetadata?.totalTokenCount,
    },
  };
}
