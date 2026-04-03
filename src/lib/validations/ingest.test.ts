import { ingestEventSchema } from "./ingest";

describe("ingestEventSchema", () => {
  const validPayload = {
    sessionId: "550e8400-e29b-41d4-a716-446655440000",
    event: {
      type: "llm_call" as const,
      name: "gpt-4o",
      input: { messages: [{ role: "user", content: "hello" }] },
      output: { content: "hi there" },
      durationMs: 1200,
    },
  };

  it("accepts a valid payload", () => {
    const result = ingestEventSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts a valid payload with sessionName", () => {
    const result = ingestEventSchema.safeParse({
      ...validPayload,
      sessionName: "Process invoice #441",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid payload with metadata", () => {
    const result = ingestEventSchema.safeParse({
      ...validPayload,
      event: {
        ...validPayload.event,
        metadata: { model: "gpt-4o", tokens: 150 },
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid sessionId", () => {
    const result = ingestEventSchema.safeParse({
      ...validPayload,
      sessionId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing event type", () => {
    const result = ingestEventSchema.safeParse({
      ...validPayload,
      event: { ...validPayload.event, type: undefined },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid event type", () => {
    const result = ingestEventSchema.safeParse({
      ...validPayload,
      event: { ...validPayload.event, type: "invalid_type" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty event name", () => {
    const result = ingestEventSchema.safeParse({
      ...validPayload,
      event: { ...validPayload.event, name: "" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative durationMs", () => {
    const result = ingestEventSchema.safeParse({
      ...validPayload,
      event: { ...validPayload.event, durationMs: -100 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing sessionId", () => {
    const noSession = { event: validPayload.event };
    const result = ingestEventSchema.safeParse(noSession);
    expect(result.success).toBe(false);
  });

  it("accepts all valid event types", () => {
    for (const type of [
      "llm_call",
      "tool_call",
      "decision",
      "error",
      "human_review",
      "context_change",
    ]) {
      const payload =
        type === "human_review"
          ? {
              ...validPayload,
              event: {
                ...validPayload.event,
                type,
                metadata: {
                  reviewer: "test@example.com",
                  decision: "approved",
                },
              },
            }
          : { ...validPayload, event: { ...validPayload.event, type } };
      const result = ingestEventSchema.safeParse(payload);
      expect(result.success).toBe(true);
    }
  });

  it("accepts a payload with sessionContext", () => {
    const result = ingestEventSchema.safeParse({
      ...validPayload,
      sessionContext: {
        systemPrompt: "You are an accounts payable agent.",
        activeRules: [
          {
            id: "auto-approve",
            description: "Auto-approve under $5k",
            parameters: { threshold: 5000 },
          },
        ],
        permissions: ["read:invoices", "write:payments"],
        environment: { region: "us-east-1" },
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts a payload with event context", () => {
    const result = ingestEventSchema.safeParse({
      ...validPayload,
      event: {
        ...validPayload.event,
        type: "decision",
        context: {
          rulesEvaluated: ["auto-approve", "vendor-verified"],
          stateAtDecision: { amount: 4500, threshold: 5000 },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects sessionContext with invalid rule (missing id)", () => {
    const result = ingestEventSchema.safeParse({
      ...validPayload,
      sessionContext: {
        activeRules: [{ description: "A rule without an id" }],
      },
    });
    expect(result.success).toBe(false);
  });

  it("accepts context_change event type", () => {
    const result = ingestEventSchema.safeParse({
      ...validPayload,
      event: {
        ...validPayload.event,
        type: "context_change",
        name: "threshold-updated",
      },
    });
    expect(result.success).toBe(true);
  });
});
