# Phase 2 — RAG / Ask-my-docs — learning checklist

Roadmap: [AI_Engineering_Roadmap_Jay_Karavadra.txt](AI_Engineering_Roadmap_Jay_Karavadra.txt) (Weeks 3–4)  
Teaching skill: Anthropic Academy **RAG and Agentic Search** only; Node/Fastify demo  
Prior work: [phase1-gemini-api](phase1-gemini-api) (Phase 1 demo **done**)

---

## Context

**Today:** Phase 1 Fastify API calls Gemini with a system prompt and returns **Zod-validated JSON**. The model only sees what you put in that request. It does not know this repo’s files.

**Wanted:** an “Ask my own docs” API. Ingest real documents into **Qdrant**, then `POST /query` retrieves relevant **chunks**, generates an answer **only from those chunks**, and returns **citations**. Manual retrieval check (five questions). Automated evals are Phase 4.

**Core problem:** stuffing a whole wiki into the prompt hits the context window, costs more, and still misses the right paragraph. RAG = search first (like Elasticsearch), then generate.

```text
docs on disk
  -> chunk
  -> embed
  -> upsert Qdrant
question
  -> embed
  -> search top-k
  -> LLM (chunks only)
  -> { answer, citations }
```

### Decisions baked into this plan

| Decision | Value | Change here if wrong |
|---|---|---|
| Vector DB | **Qdrant** local (Docker + Node client) | pgvector / Pinecone are out of this file |
| LLM + embeddings | **Gemini** (same key pattern as Phase 1) | Swap model names in env, not architecture |
| Official videos | Academy section **RAG and Agentic Search** | Not Prompt evaluation, not tools/MCP |
| Pipeline | Chunk → embed → store → retrieve → generate → cite | BM25 / multi-index after demo (L5) |
| Corpus | Real files under `docs/` (roadmap txt, Phase 1 notes, READMEs) | No lorem ipsum |
| Quality bar this phase | **Manual** 5-question retrieval check | RAGAS / LangSmith = Phase 4 |
| App folder (when you build) | `phase2-qdrant-rag/` | Do not start until L1–L4 explain-back passes (or you insist on coding earlier) |

**Consequence of Qdrant, stated explicitly:** you run a vector database as its own service. That is the AI-engineering default. Postgres+pgvector is a later option if you want “vectors next to SQL.”

**Consequence of Gemini, stated explicitly:** Phase 1 key stays on the server in `.env`. Never paste keys in chat or git.

### Two rules that everything else depends on

1. **The model must not invent sources.** If the chunks do not contain the answer, the API should say it does not know (system prompt). Citations must point at **retrieved** `source` + `chunkIndex`.
2. **Retrieve then generate.** `/query` always searches Qdrant first. Do not send the full `docs/` folder in the prompt.

---

## Phase 1 (foundations) — COMPLETED

- [x] Fastify + Gemini + system prompt + JSON + Zod (`phase1-gemini-api`).
- [x] API key on the server.

Leftover Skilljar boxes (API key lesson, Chat exercise, rest of prompt engineering) are **optional**. They do not block Phase 2.

---

## L0 — RAG in one sentence

No extra video required if this is already clear from chat.

- [x] L0.1 I can say: RAG = retrieve relevant chunks, then generate; I do not paste the whole wiki.
- [x] L0.2 I can say why that matters: context window, cost, and grounding.

**Done when:** you can explain L0 in your own words in chat (or write it under this heading).

---

## L1 — Introducing Retrieval Augmented Generation

Academy: **Introducing Retrieval Augmented Generation**

- [x] L1.1 Watch the lesson (Play to the end).
- [x] L1.2 Explain-back in chat (no copy-paste):
  - What is RAG vs a single prompt with no retrieval?
  - What is a “chunk”?
  - Why citations?

**Done when:** teacher marks this pass. Do **not** open chunking until then.

**Do not open:** Prompt evaluation, tool use, MCP, BM25.

---

## L2 — Text chunking strategies

Academy: **Text chunking strategies**

- [x] L2.1 Watch the lesson.
- [x] L2.2 Explain-back:
  - What goes wrong if chunks are too big?
  - What goes wrong if chunks are too small?
  - What is overlap for?

**Done when:** you can pick a chunk size + overlap for markdown/txt without guessing in production (constants are fine).

---

## L3 — Text embeddings

Academy: **Text embeddings**

- [x] L3.1 Watch the lesson.
- [x] L3.2 Explain-back:
  - What does an embedding vector represent?
  - Why can two sentences match without sharing words?
  - Embeddings vs the generation model (two jobs).

**Done when:** you know ingest and query both **embed** text; Qdrant stores vectors + payload, not “the Gemini chat model.”

---

## L4 — Full flow + implement

Academy: **The full RAG flow**, then **Implementing the RAG flow**

- [x] L4.1 Watch “The full RAG flow”.
- [x] L4.2 Watch “Implementing the RAG flow”.
- [x] L4.3 Explain-back: list the steps from file on disk to cited answer (chunk, embed, upsert, query embed, search, prompt, parse).

**Done when:** you can draw that pipeline without looking. Then start **B1**.

---

## L5 — Optional (after the demo works)

Academy: **BM25 lexical search**, **A Multi-Index RAG pipeline**

- [ ] L5.1 Watch BM25 (keyword vs semantic).
- [ ] L5.2 Watch multi-index (only if L5.1 is done and you want extra).

**Not blocking** the Phase 2 milestone.

---

## B1 — Scaffold `phase2-qdrant-rag/`

Mirror Phase 1: TypeScript, Fastify, Zod, `tsx`, `.gitignore` with `.env`.

- [x] B1.1 Create folder `phase2-qdrant-rag/` (do not mix into `phase1-gemini-api`).
- [x] B1.2 `package.json` scripts: `dev`, `typecheck` (same idea as Phase 1).
- [ ] B1.3 `src/config/env.ts` — Zod parse: `GEMINI_API_KEY`, `PORT`, `GEMINI_MODEL`, `GEMINI_EMBEDDING_MODEL`, `QDRANT_URL`, `QDRANT_COLLECTION`.
- [x] B1.4 `.env.example` with placeholders; `.env` gitignored.
- [x] B1.5 `src/server.ts` — Fastify, CORS, `GET /health` → `{ status: "ok" }`.

**Done when:** `npm run dev` and `GET /health` returns ok. No Qdrant required yet.

---

## B2 — Qdrant + collection

- [x] B2.1 Run Qdrant locally (Docker). Document the exact command in README later.
- [x] B2.2 Confirm dashboard or HTTP on `QDRANT_URL` (default `http://localhost:6333`).
- [x] B2.3 Create collection with vector size matching the **Gemini embedding model** (write the dimension in a code comment; do not guess).
- [x] B2.4 Node: official Qdrant client wired in a `src/services/qdrant.service.ts` (or similar).

**Done when:** empty collection exists; a tiny upsert+search smoke test works (script or route).

---

## B3 — Chunker

- [x] B3.1 `src/lib/chunk.ts` (or similar): split markdown/txt into overlapping chunks.
- [x] B3.2 Constants: `CHUNK_SIZE`, `CHUNK_OVERLAP` at the top of the file.
- [x] B3.3 Unit-free sanity: one sample file → more than one chunk; overlap visible if you log two neighbors.

**Done when:** chunking a real `docs/` file produces stable `{ text, source, chunkIndex }`.

---

## B4 — Ingest

- [x] B4.1 Add `docs/` with real files (copy or link: roadmap txt, Phase 1 README, short notes).
- [x] B4.2 Embed each chunk with Gemini embeddings API (server-side key).
- [x] B4.3 `POST /ingest` — read `docs/`, chunk, embed, upsert to Qdrant with payload `{ text, source, chunkIndex }`.
- [x] B4.4 Zod-validate ingest request if you accept a path/body; otherwise ingest-all is fine for this phase.
- [x] B4.5 Idempotency: re-ingest should not explode (wipe collection or upsert by deterministic id). Pick one and document it.

**Done when:** Qdrant point count > 0 after ingest; payload includes source path.

---

## B5 — Query + citations

- [ ] B5.1 `POST /query` body: `{ question: string }` (Zod min length).
- [ ] B5.2 Embed the question; search top-k (constant `TOP_K`).
- [ ] B5.3 System prompt: answer **only** from provided chunks; if missing, say you do not know; do not invent citations.
- [ ] B5.4 Generation model (Gemini) returns structured JSON: `{ answer, citations: [{ source, chunkIndex, quote? }] }`.
- [ ] B5.5 Zod-validate model output before `reply.send`.
- [ ] B5.6 Return token usage if the API provides it (same habit as Phase 1).

**Done when:** curl/Postman `/query` returns an answer **and** citations that match retrieved payloads.

---

## B6 — Manual retrieval check

Not LangSmith. You are the judge.

- [ ] B6.1 Write 5 questions whose answers are **in** `docs/` (you can point at the line/file).
- [ ] B6.2 Write 1 question that is **not** in the docs (must refuse / don’t know).
- [ ] B6.3 Run `/query` for each; note pass/fail under this heading (date + short note).
- [ ] B6.4 If retrieval misses: fix chunk size, `TOP_K`, or corpus — do not jump to fine-tuning.

**Done when:** at least 4/5 in-corpus questions retrieve the right file; the out-of-corpus question is not hallucinated as a fake citation.

---

## B7 — README

- [ ] B7.1 How to start Qdrant (Docker).
- [ ] B7.2 How to `.env`, ingest, query (example curl).
- [ ] B7.3 Pipeline diagram (text is enough).
- [ ] B7.4 Constants: chunk size, overlap, top-k, embedding model, vector size.

**Done when:** another engineer can run the demo from README without asking you.

---

## Out of Phase 2

- Prompt evaluation Skilljar block, RAGAS, LangSmith (Phase 4).
- Tool use, MCP, agents (Phase 3).
- pgvector, Pinecone, hybrid BM25 **as a requirement** (L5 optional only).
- AWS / Bedrock deploy (Phase 5).
- Fine-tuning (Phase 6).
- Putting the API key in the frontend or in git.

---

## Files to touch (when building)

Create under `phase2-qdrant-rag/` (names can vary slightly):

- `src/server.ts`, `src/config/env.ts`
- `src/routes/ingest.routes.ts`, `src/routes/query.routes.ts`
- `src/services/gemini.service.ts` (embed + generate)
- `src/services/qdrant.service.ts`
- `src/lib/chunk.ts`
- `src/schemas/rag.schema.ts`
- `docs/` (corpus)
- `.env.example`, `.gitignore`, `README.md`

Reuse Phase 1 patterns: Fastify register routes, Zod `safeParse` on HTTP, never log the API key.

No new cloud vendors required beyond Gemini + local Qdrant.

---

## Check when Phase 2 is done

1. Qdrant running; collection has points from real `docs/`.
2. `POST /ingest` then `POST /query` returns `{ answer, citations }` that match retrieved chunks.
3. Manual 5+1 questions recorded; no fake citations on the unknown question.
4. README lets you reproduce.
5. You did **not** need Prompt evaluation or agents to ship this.

Then Phase 3 (tools + MCP) — not before.
