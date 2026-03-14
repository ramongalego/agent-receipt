import { z } from "zod";

export const ingestEventSchema = z.object({
  sessionId: z.string().uuid("sessionId must be a valid UUID."),
  sessionName: z.string().max(200).optional(),
  event: z.object({
    type: z.enum(["llm_call", "tool_call", "decision", "error"]),
    name: z.string().min(1, "Event name is required."),
    input: z.unknown(),
    output: z.unknown(),
    durationMs: z.number().int().nonnegative(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type IngestEventInput = z.infer<typeof ingestEventSchema>;
