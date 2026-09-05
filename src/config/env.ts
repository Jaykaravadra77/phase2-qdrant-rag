import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  QDRANT_URL: z.string().url().default("http://localhost:6333"),
  QDRANT_COLLECTION: z.string().min(1).default("docs"),
  // Used in B4+. Collection vector size is pinned to this model's default output.
  GEMINI_EMBEDDING_MODEL: z.string().min(1).default("gemini-embedding-001"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required in .env"),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.7-flash"),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
