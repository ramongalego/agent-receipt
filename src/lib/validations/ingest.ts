import { z } from "zod";

const humanReviewDecision = z.enum(["approved", "rejected", "modified"]);

const complianceSchema = z
  .object({
    containsPII: z.boolean().optional(),
    dataCategory: z.string().optional(),
    retentionOverride: z.number().int().nonnegative().optional(),
  })
  .optional();

const ruleSchema = z.object({
  id: z.string().min(1).max(100),
  description: z.string().max(500),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export const sessionContextSchema = z.object({
  systemPrompt: z.string().max(50000).optional(),
  activeRules: z.array(ruleSchema).max(50).optional(),
  permissions: z.array(z.string().max(200)).max(100).optional(),
  environment: z.record(z.string(), z.unknown()).optional(),
});

export const eventContextSchema = z.object({
  rulesEvaluated: z.array(z.string().max(100)).max(50).optional(),
  stateAtDecision: z.record(z.string(), z.unknown()).optional(),
  systemPrompt: z.string().max(50000).optional(),
});

export const ingestEventSchema = z
  .object({
    sessionId: z.string().uuid("sessionId must be a valid UUID."),
    sessionName: z.string().max(200).optional(),
    sessionContext: sessionContextSchema.optional(),
    event: z.object({
      type: z.enum([
        "llm_call",
        "tool_call",
        "decision",
        "error",
        "human_review",
        "context_change",
      ]),
      name: z.string().min(1, "Event name is required.").max(100),
      input: z.unknown(),
      output: z.unknown(),
      durationMs: z.number().int().nonnegative(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      compliance: complianceSchema,
      context: eventContextSchema.optional(),
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
