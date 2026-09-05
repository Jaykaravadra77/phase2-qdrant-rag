# Phase 1 notes

The Phase 1 demo is a Fastify API that calls Gemini with a system prompt and returns Zod-validated JSON for ticket triage.

The API key stays on the server in `.env`. It is never sent to the browser or committed to git.

The model only sees what the request puts in the prompt. It does not read this repository's files.
