import { z } from "zod";

const humanReviewDecision = z.enum(["approved", "rejected", "modified"]);

const complianceSchema = z
  .object({
    containsPII: z.boolean().optional(),
    dataCategory: z.string().optional(),
    retentionOverride: z.number().int().nonnegative().optional(),
  })
  .optional();

export const ingestEventSchema = z
  .object({
    sessionId: z.string().uuid("sessionId must be a valid UUID."),
    sessionName: z.string().max(200).optional(),
    event: z.object({
      type: z.enum([
        "llm_call",
        "tool_call",
        "decision",
        "error",
        "human_review",
      ]),
      name: z.string().min(1, "Event name is required.").max(100),
      input: z.unknown(),
      output: z.unknown(),
      durationMs: z.number().int().nonnegative(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      compliance: complianceSchema,
    }),
  })
  .refine(
    (data) => {
      if (data.event.type === "human_review") {
        const meta = data.event.metadata;
        if (!meta) return false;
        if (typeof meta.reviewer !== "string" || meta.reviewer.length === 0)
          return false;
        const result = humanReviewDecision.safeParse(meta.decision);
        return result.success;
      }
      return true;
    },
    {
      message:
        'human_review events require metadata.reviewer (string) and metadata.decision ("approved" | "rejected" | "modified").',
      path: ["event", "metadata"],
    },
  );

export type IngestEventInput = z.infer<typeof ingestEventSchema>;
