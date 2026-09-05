import type { FastifyInstance } from "fastify";
import { ingestBodySchema } from "../schemas/rag.schema.js";
import { ingestDocs } from "../services/ingest.service.js";

export async function registerIngestRoutes(app: FastifyInstance): Promise<void> {
  app.post("/ingest", async (request, reply) => {
    const body = request.body === undefined || request.body === null ? {} : request.body;
    ingestBodySchema.parse(body);

    const result = await ingestDocs();
    return reply.status(200).send({
      status: "ok",
      ...result,
    });
  });
}
