import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";
import { chunkText, type Chunk } from "../lib/chunk.js";
import { pointIdForChunk } from "../lib/point-id.js";
import { embedTexts } from "./gemini.service.js";
import { createQdrantClient, ensureCollection } from "./qdrant.service.js";

const DOCS_DIR = resolve(process.cwd(), "docs");
const DOC_EXTENSIONS = new Set([".md", ".txt"]);

export async function ingestDocs(): Promise<{ files: number; chunks: number; collection: string }> {
  const files = await listDocFiles();
  if (files.length === 0) {
    throw new AppError("No .md or .txt files in docs/", 400);
  }

  const chunks: Chunk[] = [];
  for (const absolutePath of files) {
    const text = await readFile(absolutePath, "utf8");
    const source = relative(process.cwd(), absolutePath);
    chunks.push(...chunkText(text, source));
  }

  if (chunks.length === 0) {
    throw new AppError("docs/ files produced no chunks", 400);
  }

  const vectors = await embedTexts(
    chunks.map((chunk) => chunk.text),
    "RETRIEVAL_DOCUMENT",
  );

  const client = createQdrantClient();
  await ensureCollection(client);

  await client.upsert(env.QDRANT_COLLECTION, {
    wait: true,
    points: chunks.map((chunk, index) => ({
      id: pointIdForChunk(chunk.source, chunk.chunkIndex),
      vector: vectors[index],
      payload: {
        text: chunk.text,
        source: chunk.source,
        chunkIndex: chunk.chunkIndex,
      },
    })),
  });

  return {
    files: files.length,
    chunks: chunks.length,
    collection: env.QDRANT_COLLECTION,
  };
}

async function listDocFiles(): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(DOCS_DIR, { withFileTypes: true });
  } catch {
    throw new AppError("docs/ folder is missing", 400);
  }

  return entries
    .filter((entry) => entry.isFile() && DOC_EXTENSIONS.has(extname(entry.name).toLowerCase()))
    .map((entry) => join(DOCS_DIR, entry.name))
    .sort();
}
