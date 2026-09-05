import Fastify, { type FastifyInstance } from "fastify";
import { env } from "./config/env.js";
import { registerCors } from "./plugins/cors.js";
import { registerErrorHandler } from "./plugins/error-handler.js";
import { registerHealthRoutes } from "./routes/health.routes.js";
import { registerIngestRoutes } from "./routes/ingest.routes.js";
import { registerQueryRoutes } from "./routes/query.routes.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
  });

  await registerCors(app);
  await registerErrorHandler(app);
  await registerHealthRoutes(app);
  await registerIngestRoutes(app);
  await registerQueryRoutes(app);

  return app;
}
