import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = await buildApp();

function logFatal(err: unknown, label: string): void {
  app.log.fatal({ err }, label);
}

process.on("unhandledRejection", (reason) => {
  logFatal(reason, "unhandledRejection");
});

process.on("uncaughtException", (err) => {
  logFatal(err, "uncaughtException");
  process.exit(1);
});

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, "shutting down");
  try {
    await app.close();
    process.exit(0);
  } catch (err) {
    logFatal(err, "shutdown failed");
    process.exit(1);
  }
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (err) {
  logFatal(err, "failed to listen");
  process.exit(1);
}
