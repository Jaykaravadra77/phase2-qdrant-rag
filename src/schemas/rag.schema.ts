import { z } from "zod";

export const ingestBodySchema = z.object({}).strict();

export const queryBodySchema = z
  .object({
    question: z.string().trim().min(3).max(2000),
  })
  .strict();

export const citationSchema = z.object({
  source: z.string().min(1),
  chunkIndex: z.number().int().nonnegative(),
  quote: z.string().min(1).max(400).optional(),
});

export const queryModelOutputSchema = z.object({
  answer: z.string().min(1),
  citations: z.array(citationSchema),
});

export type IngestBody = z.infer<typeof ingestBodySchema>;
export type QueryBody = z.infer<typeof queryBodySchema>;
export type QueryModelOutput = z.infer<typeof queryModelOutputSchema>;
