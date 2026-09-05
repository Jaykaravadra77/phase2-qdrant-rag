import type { FastifyInstance } from "fastify";
import { queryBodySchema } from "../schemas/rag.schema.js";
import { queryDocs } from "../services/query.service.js";

export async function registerQueryRoutes(app: FastifyInstance): Promise<void> {
  app.post("/query", async (request, reply) => {
    const { question } = queryBodySchema.parse(request.body);
    const result = await queryDocs(question);
    return reply.status(200).send({
      status: "ok",
      ...result,
    });
  });
}
