import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";

function sendError(
  reply: FastifyReply,
  statusCode: number,
  error: string,
  message: string,
): FastifyReply {
  return reply.status(statusCode).send({ error, message });
}

export async function registerErrorHandler(app: FastifyInstance): Promise<void> {
  app.setErrorHandler((err: FastifyError | Error, _request: FastifyRequest, reply: FastifyReply) => {
    if (err instanceof AppError) {
      return sendError(reply, err.statusCode, "AppError", err.expose ? err.message : "Request failed");
    }

    if (err instanceof ZodError) {
      return sendError(reply, 400, "Validation failed", "Invalid request");
    }

    const statusCode = "statusCode" in err && typeof err.statusCode === "number" ? err.statusCode : 500;
    if (statusCode >= 500) {
      app.log.error(err);
      return sendError(reply, 500, "Internal Server Error", "Internal Server Error");
    }

    return sendError(reply, statusCode, err.name || "Error", err.message);
  });
}
