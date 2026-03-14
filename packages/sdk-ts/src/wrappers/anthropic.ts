import { randomUUID } from "crypto";
import type { IngestClient, WrapperOptions } from "../types";

function hasOnMethod(value: unknown): value is {
  on: (event: string, cb: (...args: unknown[]) => void) => unknown;
} {
  return (
    value !== null &&
    typeof value === "object" &&
    "on" in (value as object) &&
    typeof (value as { on: unknown }).on === "function"
  );
}

type AnthropicToolUse = {
  type: "tool_use";
  id: string;
  name: string;
  input: unknown;
};

type StructuredOutput = {
  output: unknown;
  metadata?: Record<string, unknown>;
};

function tryParseStructuredOutput(result: unknown): StructuredOutput {
  if (!result || typeof result !== "object") return { output: result };
  const msg = result as { content?: unknown[] };
  if (!Array.isArray(msg.content)) return { output: result };

  let hasStructured = false;
  const parsedContent = msg.content.map((block) => {
    if (
      typeof block === "object" &&
      block !== null &&
      (block as { type?: string }).type === "text"
    ) {
      const text = (block as { text?: string }).text;
      if (typeof text === "string" && text.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(text);
          hasStructured = true;
          return { ...block, text: parsed };
        } catch {
          return block;
        }
      }
    }
    return block;
  });

  if (!hasStructured) return { output: result };
  return {
    output: { ...msg, content: parsedContent },
    metadata: { structured: true },
  };
}

function extractToolCalls(result: unknown): AnthropicToolUse[] {
  if (!result || typeof result !== "object") return [];
  const msg = result as { content?: unknown[] };
  if (!Array.isArray(msg.content)) return [];
  return msg.content.filter(
    (block): block is AnthropicToolUse =>
      typeof block === "object" &&
      block !== null &&
      (block as { type?: string }).type === "tool_use",
  );
}

function sendToolCallEvents(
  toolCalls: AnthropicToolUse[],
  ingest: IngestClient,
  sessionId: string,
  sessionName: string | undefined,
  durationMs: number,
): void {
  for (const tool of toolCalls) {
    ingest
      .send({
        sessionId,
        sessionName,
        event: {
          type: "tool_call",
          name: tool.name,
          input: tool.input,
          output: { toolUseId: tool.id },
          durationMs,
        },
      })
      .catch(() => {});
  }
}

export function wrapAnthropic<T extends object>(
  client: T,
  ingest: IngestClient,
  options?: WrapperOptions,
): T {
  const sessionId = randomUUID();
  const sessionName = options?.sessionName;

  const handler: ProxyHandler<T> = {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (prop === "messages") {
        return new Proxy(value as object, {
          get(msgTarget, msgProp) {
            const msgValue = Reflect.get(msgTarget, msgProp);

            if (msgProp === "create" && typeof msgValue === "function") {
              return async function wrappedCreate(
                ...args: unknown[]
              ): Promise<unknown> {
                const start = Date.now();
                const params = args[0] as Record<string, unknown>;
                try {
                  const result = await (
                    msgValue as (...a: unknown[]) => Promise<unknown>
                  ).apply(msgTarget, args);
                  const durationMs = Date.now() - start;

                  if (params?.stream && hasOnMethod(result)) {
                    result.on("finalMessage", (message: unknown) => {
                      const finalDurationMs = Date.now() - start;
                      const structured = tryParseStructuredOutput(message);
                      ingest
                        .send({
                          sessionId,
                          sessionName,
                          event: {
                            type: "llm_call",
                            name: (params?.model as string) ?? "anthropic",
                            input: params,
                            output: structured.output,
                            durationMs: finalDurationMs,
                            metadata: structured.metadata,
                          },
                        })
                        .catch(() => {});

                      const toolCalls = extractToolCalls(message);
                      sendToolCallEvents(
                        toolCalls,
                        ingest,
                        sessionId,
                        sessionName,
                        finalDurationMs,
                      );
                    });
                    return result;
                  }

                  const structured = tryParseStructuredOutput(result);
                  ingest
                    .send({
                      sessionId,
                      sessionName,
                      event: {
                        type: "llm_call",
                        name: (params?.model as string) ?? "anthropic",
                        input: params,
                        output: structured.output,
                        durationMs,
                        metadata: structured.metadata,
                      },
                    })
                    .catch(() => {});

                  const toolCalls = extractToolCalls(result);
                  sendToolCallEvents(
                    toolCalls,
                    ingest,
                    sessionId,
                    sessionName,
                    durationMs,
                  );

                  return result;
                } catch (e) {
                  const durationMs = Date.now() - start;
                  ingest
                    .send({
                      sessionId,
                      sessionName,
                      event: {
                        type: "error",
                        name: (params?.model as string) ?? "anthropic",
                        input: params,
                        output: {
                          error: e instanceof Error ? e.message : String(e),
                        },
                        durationMs,
                      },
                    })
                    .catch(() => {});
                  throw e;
                }
              };
            }

            if (msgProp === "stream" && typeof msgValue === "function") {
              return function wrappedStream(...args: unknown[]): unknown {
                const start = Date.now();
                const params = args[0] as Record<string, unknown>;
                const result = (msgValue as (...a: unknown[]) => unknown).apply(
                  msgTarget,
                  args,
                );

                if (hasOnMethod(result)) {
                  result.on("finalMessage", (message: unknown) => {
                    const durationMs = Date.now() - start;
                    const structured = tryParseStructuredOutput(message);
                    ingest
                      .send({
                        sessionId,
                        sessionName,
                        event: {
                          type: "llm_call",
                          name: (params?.model as string) ?? "anthropic",
                          input: params,
                          output: structured.output,
                          durationMs,
                          metadata: structured.metadata,
                        },
                      })
                      .catch(() => {});

                    const toolCalls = extractToolCalls(message);
                    sendToolCallEvents(
                      toolCalls,
                      ingest,
                      sessionId,
                      sessionName,
                      durationMs,
                    );
                  });
                }

                return result;
              };
            }

            if (typeof msgValue === "function") {
              return (msgValue as (...a: unknown[]) => unknown).bind(msgTarget);
            }
            return msgValue;
          },
        });
      }

      return value;
    },
  };

  return new Proxy(client, handler);
}
