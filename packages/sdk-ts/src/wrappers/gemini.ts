import { randomUUID } from "crypto";
import type { IngestClient, WrapperOptions } from "../types";

type GeminiFunctionCall = {
  name: string;
  args: unknown;
};

function extractFunctionCalls(result: unknown): GeminiFunctionCall[] {
  if (!result || typeof result !== "object") return [];
  const res = result as { functionCalls?: unknown[] };
  if (!Array.isArray(res.functionCalls)) return [];
  return res.functionCalls.filter(
    (fc): fc is GeminiFunctionCall =>
      typeof fc === "object" &&
      fc !== null &&
      typeof (fc as { name?: unknown }).name === "string",
  );
}

export function wrapGemini<T extends object>(
  client: T,
  ingest: IngestClient,
  options?: WrapperOptions,
): T {
  const sessionId = randomUUID();
  const sessionName = options?.sessionName;

  const handler: ProxyHandler<T> = {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (prop === "models") {
        return new Proxy(value as object, {
          get(modelsTarget, modelsProp) {
            const modelsValue = Reflect.get(modelsTarget, modelsProp);

            if (
              modelsProp === "generateContent" &&
              typeof modelsValue === "function"
            ) {
              return async function wrappedGenerateContent(
                ...args: unknown[]
              ): Promise<unknown> {
                const start = Date.now();
                const params = (args[0] ?? {}) as Record<string, unknown>;
                const modelName =
                  typeof params.model === "string" ? params.model : "unknown";

                const result = await (
                  modelsValue as (...a: unknown[]) => Promise<unknown>
                ).apply(modelsTarget, args);
                const durationMs = Date.now() - start;

                const res = result as { text?: string };
                ingest
                  .send({
                    sessionId,
                    sessionName,
                    event: {
                      type: "llm_call",
                      name: modelName,
                      input: params.contents,
                      output: res.text,
                      durationMs,
                    },
                  })
                  .catch(() => {});

                const functionCalls = extractFunctionCalls(result);
                for (const fc of functionCalls) {
                  ingest
                    .send({
                      sessionId,
                      sessionName,
                      event: {
                        type: "tool_call",
                        name: fc.name,
                        input: fc.args,
                        output: null,
                        durationMs,
                      },
                    })
                    .catch(() => {});
                }

                return result;
              };
            }

            if (
              modelsProp === "generateContentStream" &&
              typeof modelsValue === "function"
            ) {
              return async function wrappedGenerateContentStream(
                ...args: unknown[]
              ): Promise<unknown> {
                const start = Date.now();
                const params = (args[0] ?? {}) as Record<string, unknown>;
                const modelName =
                  typeof params.model === "string" ? params.model : "unknown";

                const result = await (
                  modelsValue as (...a: unknown[]) => Promise<unknown>
                ).apply(modelsTarget, args);

                const originalIterable = result as AsyncIterable<unknown>;

                async function* wrappedStream(): AsyncGenerator<unknown> {
                  const textChunks: string[] = [];
                  // Send in finally so the event is recorded even when the
                  // consumer breaks out of the stream early.
                  try {
                    for await (const chunk of originalIterable) {
                      const c = chunk as { text?: string };
                      textChunks.push(c.text ?? "");
                      yield chunk;
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
                          input: params.contents,
                          output: textChunks.join(""),
                          durationMs,
                        },
                      })
                      .catch(() => {});
                  }
                }

                return wrappedStream();
              };
            }

            if (typeof modelsValue === "function") {
              return (modelsValue as (...a: unknown[]) => unknown).bind(
                modelsTarget,
              );
            }
            return modelsValue;
          },
        });
      }

      return value;
    },
  };

  return new Proxy(client, handler);
}
