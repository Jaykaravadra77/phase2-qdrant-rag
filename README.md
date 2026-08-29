# phase2-qdrant-rag

Fastify + TypeScript boilerplate for the Phase 2 RAG demo. **No ingest/query logic yet.**

## Layout

```text
src/
  server.ts              listen + SIGTERM / SIGINT + process error handlers
  app.ts                 build Fastify, register plugins and routes
  config/env.ts          Zod-validated env
  plugins/               cors, central error handler
  routes/health.routes.ts
  lib/errors.ts          AppError for 4xx
```

Same runtime family as `phase1-gemini-api`: ESM, Fastify 5, Zod, `tsx`. No extra linters, test runners, or Gemini/Qdrant packages until those tasks.

## Run

```bash
cp .env.example .env
npm install
npm run dev
```

`GET http://localhost:3000/health` → `{ "status": "ok" }`.

`npm run typecheck` and `npm run build` / `npm start` for compiled `dist/`.
