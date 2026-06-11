import { randomUUID } from "crypto";
import type { IngestClient, WrapperOptions } from "../types";

type MistralToolCall = {
  function: { name: string; arguments: string };
};

function extractToolCalls(result: unknown): MistralToolCall[] {
  if (!result || typeof result !== "object") return [];
  const res = result as {
    choices?: { message?: { toolCalls?: unknown[] } }[];
  };
  const toolCalls = res.choices?.[0]?.message?.toolCalls;
  if (!Array.isArray(toolCalls)) return [];
  return toolCalls.filter(
    (tc): tc is MistralToolCall =>
      typeof tc === "object" &&
      tc !== null &&
      typeof (tc as { function?: { name?: unknown } }).function?.name ===
        "string",
  );
}

function sendToolCallEvents(
  toolCalls: MistralToolCall[],
  ingest: IngestClient,
  sessionId: string,
  sessionName: string | undefined,
  durationMs: number,
): void {
  for (const tc of toolCalls) {
    let parsedArgs: unknown;
    try {
      parsedArgs = JSON.parse(tc.function.arguments);
    } catch {
      parsedArgs = tc.function.arguments;
    }
    ingest
      .send({
        sessionId,
        sessionName,
        event: {
          type: "tool_call",
          name: tc.function.name,
          input: parsedArgs,
          output: null,
          durationMs,
        },
      })
      .catch(() => {});
  }
}

export function wrapMistral<T extends object>(
  client: T,
  ingest: IngestClient,
  options?: WrapperOptions,
): T {
  const sessionId = randomUUID();
  const sessionName = options?.sessionName;

  const handler: ProxyHandler<T> = {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (prop === "chat") {
        return new Proxy(value as object, {
          get(chatTarget, chatProp) {
            const chatValue = Reflect.get(chatTarget, chatProp);

            if (chatProp === "complete" && typeof chatValue === "function") {
              return async function wrappedComplete(
                ...args: unknown[]
              ): Promise<unknown> {
                const start = Date.now();
                const params = (args[0] ?? {}) as Record<string, unknown>;
                const modelName =
                  typeof params.model === "string" ? params.model : "unknown";

                const result = await (
                  chatValue as (...a: unknown[]) => Promise<unknown>
                ).apply(chatTarget, args);
                const durationMs = Date.now() - start;

                const res = result as {
                  choices?: { message?: { content?: string } }[];
                };
                const content = res.choices?.[0]?.message?.content;

                const fmt = params.responseFormat as
                  | { type?: string }
                  | undefined;
                const isJson = fmt?.type === "json_object";

                let output: unknown = content;
                let metadata: Record<string, unknown> | undefined;

                if (isJson && typeof content === "string") {
                  try {
                    output = JSON.parse(content);
                    metadata = { structured: true };
                  } catch {
                    // keep raw string
                  }
                }

                ingest
                  .send({
                    sessionId,
                    sessionName,
                    event: {
                      type: "llm_call",
                      name: modelName,
                      input: params.messages,
                      output,
                      durationMs,
                      metadata,
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
              };
            }

            if (chatProp === "stream" && typeof chatValue === "function") {
              return async function wrappedStream(
                ...args: unknown[]
              ): Promise<unknown> {
                const start = Date.now();
                const params = (args[0] ?? {}) as Record<string, unknown>;
                const modelName =
                  typeof params.model === "string" ? params.model : "unknown";

                const result = await (
                  chatValue as (...a: unknown[]) => Promise<unknown>
                ).apply(chatTarget, args);

                const originalIterable = result as AsyncIterable<unknown>;

                async function* wrapped(): AsyncGenerator<unknown> {
                  const textChunks: string[] = [];
                  // Send in finally so the event is recorded even when the
                  // consumer breaks out of the stream early.
                  try {
                    for await (const event of originalIterable) {
                      const evt = event as {
                        data?: {
                          choices?: { delta?: { content?: string } }[];
                        };
                      };
                      textChunks.push(
                        evt.data?.choices?.[0]?.delta?.content ?? "",
                      );
                      yield event;
                    }
                  } finally {
                    const durationMs = Date.now() - start;
                    ingest
                      .send({
                        sessionId,
                        sessionName,
                        event: {
                          type: "llm_call",
                          name: modelName,
                          input: params.messages,
                          output: textChunks.join(""),
                          durationMs,
                        },
                      })
                      .catch(() => {});
                  }
                }

                return wrapped();
              };
            }

            if (typeof chatValue === "function") {
              return (chatValue as (...a: unknown[]) => unknown).bind(
                chatTarget,
              );
            }
            return chatValue;
          },
        });
      }

      return value;
    },
  };

  return new Proxy(client, handler);
}
