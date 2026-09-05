# phase2-qdrant-rag

Ask-my-docs API: Fastify + TypeScript, local Qdrant, Gemini embeddings + generation.

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

## Constants

| Name | Value |
|---|---|
| `CHUNK_SIZE` | 1000 characters |
| `CHUNK_OVERLAP` | 200 characters |
| `TOP_K` | 5 |
| Embedding model | `gemini-embedding-001` |
| Vector size | 3072 |
| Distance | Cosine |
| Generation model | `gemini-3.7-flash` (`GEMINI_MODEL`) |

Re-ingest is safe: point ids are SHA-256 of `source` + `chunkIndex`. Deleted files can leave old points until you recreate the collection.

## 1. Qdrant

From this folder:

```bash
docker-compose up -d
```

HTTP: `http://localhost:6333`. Dashboard: `http://localhost:6333/dashboard`.

Optional smoke test (creates collection `docs` if missing):

```bash
npm run qdrant:smoke
```

## 2. App env

```bash
cp .env.example .env
```

Set `GEMINI_API_KEY` in `.env`. Never commit `.env`.

```bash
npm install
npm run dev
```

`GET http://localhost:3000/health` → `{ "status": "ok" }`.

## 3. Ingest

Reads `docs/*.md` and `docs/*.txt` only.

```bash
curl --location --request POST 'http://localhost:3000/ingest' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

## 4. Query

```bash
curl --location 'http://localhost:3000/query' \
  --header 'Content-Type: application/json' \
  --data '{
    "question": "What is RAG in this project?"
  }'
```

The model must answer only from retrieved chunks. If the docs do not contain it, it should say it does not know and not invent citations.

`npm run typecheck` and `npm run build` / `npm start` for compiled `dist/`.
