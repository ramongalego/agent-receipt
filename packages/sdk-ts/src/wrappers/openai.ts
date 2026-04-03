import { randomUUID } from "crypto";
import type { IngestClient, EventContext, WrapperOptions } from "../types";

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    Symbol.asyncIterator in (value as object)
  );
}

type OpenAIToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

type StructuredOutput = {
  output: unknown;
  metadata?: Record<string, unknown>;
};

function tryParseStructuredOutput(
  params: Record<string, unknown>,
  result: unknown,
): StructuredOutput {
  if (!result || typeof result !== "object") return { output: result };
  const fmt = params?.response_format as { type?: string } | undefined;
  if (fmt?.type !== "json_object" && fmt?.type !== "json_schema") {
    return { output: result };
  }

  const res = result as {
    choices?: { message?: { content?: string } }[];
  };
  const content = res.choices?.[0]?.message?.content;
  if (typeof content !== "string") return { output: result };

  try {
    const parsed = JSON.parse(content);
    const patched = {
      ...res,
      choices: res.choices!.map((c, i) =>
        i === 0 ? { ...c, message: { ...c.message, content: parsed } } : c,
      ),
    };
    return { output: patched, metadata: { structured: true } };
  } catch {
    return { output: result };
  }
}

function extractToolCalls(result: unknown): OpenAIToolCall[] {
  if (!result || typeof result !== "object") return [];
  const res = result as {
    choices?: { message?: { tool_calls?: unknown[] } }[];
  };
  const toolCalls = res.choices?.[0]?.message?.tool_calls;
  if (!Array.isArray(toolCalls)) return [];
  return toolCalls.filter(
    (tc): tc is OpenAIToolCall =>
      typeof tc === "object" &&
      tc !== null &&
      (tc as { type?: string }).type === "function",
  );
}

function extractSystemPrompt(
  params: Record<string, unknown>,
): EventContext | undefined {
  const messages = params?.messages;
  if (!Array.isArray(messages)) return undefined;
  const systemMessages = messages.filter(
    (m) =>
      typeof m === "object" &&
      m !== null &&
      (m as { role?: string }).role === "system",
  );
  if (systemMessages.length === 0) return undefined;
  const combined = systemMessages
    .map((m) => {
      const content = (m as { content?: unknown }).content;
      return typeof content === "string" ? content : JSON.stringify(content);
    })
    .join("\n");
  return { systemPrompt: combined };
}

function sendToolCallEvents(
  toolCalls: OpenAIToolCall[],
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
          output: { toolCallId: tc.id },
          durationMs,
        },
      })
      .catch(() => {});
  }
}

function wrapStream(
  stream: AsyncIterable<unknown>,
  ingest: IngestClient,
  sessionId: string,
  sessionName: string | undefined,
  params: Record<string, unknown>,
  start: number,
  eventContext: EventContext | undefined,
): AsyncIterable<unknown> {
  return {
    [Symbol.asyncIterator]() {
      const iterator = stream[Symbol.asyncIterator]();
      const chunks: unknown[] = [];

      return {
        async next() {
          const result = await iterator.next();

          if (!result.done) {
            chunks.push(result.value);
          }

          if (result.done) {
            const durationMs = Date.now() - start;
            ingest
              .send({
                sessionId,
                sessionName,
                event: {
                  type: "llm_call",
                  name: (params?.model as string) ?? "openai",
                  input: params,
                  output: { chunks },
                  durationMs,
                  context: eventContext,
                },
              })
              .catch(() => {});
          }

          return result;
        },

        async return(value?: unknown) {
          if (iterator.return) {
            return iterator.return(value);
          }
          return { done: true as const, value };
        },
      };
    },
  };
}

export function wrapOpenAI<T extends object>(
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
          get(chatTarget, chatProp, chatReceiver) {
            const chatValue = Reflect.get(chatTarget, chatProp, chatReceiver);
            if (chatProp === "completions") {
              return new Proxy(chatValue as object, {
                get(compTarget, compProp, compReceiver) {
                  const compValue = Reflect.get(
                    compTarget,
                    compProp,
                    compReceiver,
                  );
                  if (
                    compProp === "create" &&
                    typeof compValue === "function"
                  ) {
                    return async function wrappedCreate(
                      ...args: unknown[]
                    ): Promise<unknown> {
                      const start = Date.now();
                      const params = args[0] as Record<string, unknown>;
                      try {
                        const result = await (
                          compValue as (...a: unknown[]) => Promise<unknown>
                        ).apply(compTarget, args);
                        const durationMs = Date.now() - start;

                        if (params?.stream && isAsyncIterable(result)) {
                          return wrapStream(
                            result,
                            ingest,
                            sessionId,
                            sessionName,
                            params,
                            start,
                            extractSystemPrompt(params),
                          );
                        }

                        const structured = tryParseStructuredOutput(
                          params,
                          result,
                        );
                        const eventContext = extractSystemPrompt(params);
                        ingest
                          .send({
                            sessionId,
                            sessionName,
                            event: {
                              type: "llm_call",
                              name: (params?.model as string) ?? "openai",
                              input: params,
                              output: structured.output,
                              durationMs,
                              metadata: structured.metadata,
                              context: eventContext,
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
                              name: (params?.model as string) ?? "openai",
                              input: params,
                              output: {
                                error:
                                  e instanceof Error ? e.message : String(e),
                              },
                              durationMs,
                            },
                          })
                          .catch(() => {});
                        throw e;
                      }
                    };
                  }
                  return compValue;
                },
              });
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
