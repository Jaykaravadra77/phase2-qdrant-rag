import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CHUNK_OVERLAP, CHUNK_SIZE, chunkText } from "./src/lib/chunk.js";

const source = join(dirname(fileURLToPath(import.meta.url)), "..", "PHASE2.md");
const text = readFileSync(source, "utf8");
const chunks = chunkText(text, source);

console.log(`file=${source}`);
console.log(`chars=${text.length} CHUNK_SIZE=${CHUNK_SIZE} CHUNK_OVERLAP=${CHUNK_OVERLAP}`);
console.log(`chunks=${chunks.length}`);

if (chunks.length < 2) {
  throw new Error("Need a file longer than CHUNK_SIZE so overlap is visible");
}

const overlapFromPrev = chunks[0].text.slice(-CHUNK_OVERLAP);
const overlapFromNext = chunks[1].text.slice(0, CHUNK_OVERLAP);

console.log("\n--- end of chunk 0 (overlap window) ---");
console.log(overlapFromPrev);
console.log("\n--- start of chunk 1 (overlap window) ---");
console.log(overlapFromNext);

if (overlapFromPrev !== overlapFromNext) {
  throw new Error("Neighbors do not share the overlap window");
}

console.log("\noverlap matches");
