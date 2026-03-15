import { randomUUID } from "crypto";
import type { IngestClient, WrapperOptions } from "../types";

type VercelAIFunctions = {
  generateText?: (...args: unknown[]) => Promise<unknown>;
  streamText?: (...args: unknown[]) => Promise<unknown>;
  generateObject?: (...args: unknown[]) => Promise<unknown>;
  streamObject?: (...args: unknown[]) => Promise<unknown>;
};

type WrappedVercelAI<T extends VercelAIFunctions> = {
  [K in keyof T]: T[K];
};

function extractModelName(params: Record<string, unknown>): string {
  const model = params?.model;
  if (typeof model === "string") return model;
  if (model && typeof model === "object" && "modelId" in model) {
    return String((model as { modelId: unknown }).modelId);
  }
  return "unknown";
}

function extractInput(params: Record<string, unknown>): unknown {
  const rest = { ...params };
  delete rest.model;
  return rest;
}

export function wrapVercelAI<T extends VercelAIFunctions>(
  fns: T,
  ingest: IngestClient,
  options?: WrapperOptions,
): WrappedVercelAI<T> {
  const sessionId = options?.sessionName ? randomUUID() : randomUUID();
  const sessionName = options?.sessionName;

  function send(
    name: string,
    input: unknown,
    output: unknown,
    durationMs: number,
    metadata?: Record<string, unknown>,
  ): void {
    if (!sessionId) {
      console.warn("[AgentReceipt] Missing sessionId, skipping ingest.");
    }
    ingest
      .send({
        sessionId,
        sessionName,
        event: {
          type: "llm_call",
          name,
          input,
          output,
          durationMs,
          metadata,
        },
      })
      .catch(() => {});
  }

  const wrapped: Record<string, unknown> = {};

  if (fns.generateText) {
    const original = fns.generateText;
    wrapped.generateText = async function wrappedGenerateText(
      ...args: unknown[]
    ): Promise<unknown> {
      const start = Date.now();
      const params = (args[0] ?? {}) as Record<string, unknown>;
      const modelName = extractModelName(params);

      const result = await original(...args);
      const durationMs = Date.now() - start;

      const res = result as {
        text?: string;
        output?: unknown;
      };

      const hasStructuredOutput =
        "output" in params && res.output !== undefined;
      send(
        modelName,
        extractInput(params),
        hasStructuredOutput ? res.output : res.text,
        durationMs,
        hasStructuredOutput ? { structured: true } : undefined,
      );

      return result;
    };
  }

  if (fns.streamText) {
    const original = fns.streamText;
    wrapped.streamText = async function wrappedStreamText(
      ...args: unknown[]
    ): Promise<unknown> {
      const start = Date.now();
      const params = (args[0] ?? {}) as Record<string, unknown>;
      const modelName = extractModelName(params);

      const result = await original(...args);

      const res = result as { text: Promise<string> };
      res.text
        .then((text: string) => {
          const durationMs = Date.now() - start;
          send(modelName, extractInput(params), text, durationMs);
        })
        .catch(() => {});

      return result;
    };
  }

  if (fns.generateObject) {
    const original = fns.generateObject;
    wrapped.generateObject = async function wrappedGenerateObject(
      ...args: unknown[]
    ): Promise<unknown> {
      const start = Date.now();
      const params = (args[0] ?? {}) as Record<string, unknown>;
      const modelName = extractModelName(params);

      const result = await original(...args);
      const durationMs = Date.now() - start;

      const res = result as { object: unknown };
      send(modelName, extractInput(params), res.object, durationMs, {
        structured: true,
      });

      return result;
    };
  }

  if (fns.streamObject) {
    const original = fns.streamObject;
    wrapped.streamObject = async function wrappedStreamObject(
      ...args: unknown[]
    ): Promise<unknown> {
      const start = Date.now();
      const params = (args[0] ?? {}) as Record<string, unknown>;
      const modelName = extractModelName(params);

      const result = await original(...args);

      const res = result as { object: Promise<unknown> };
      res.object
        .then((object: unknown) => {
          const durationMs = Date.now() - start;
          send(modelName, extractInput(params), object, durationMs, {
            structured: true,
          });
        })
        .catch(() => {});

      return result;
    };
  }

  return wrapped as WrappedVercelAI<T>;
}
