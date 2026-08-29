import Fastify, { type FastifyInstance } from "fastify";
import { env } from "./config/env.js";
import { registerCors } from "./plugins/cors.js";
import { registerErrorHandler } from "./plugins/error-handler.js";
import { registerHealthRoutes } from "./routes/health.routes.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
  });

  await registerCors(app);
  await registerErrorHandler(app);
  await registerHealthRoutes(app);

  return app;
}
