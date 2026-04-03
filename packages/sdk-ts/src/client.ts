import { createIngestClient } from "./ingest";
import { createSession } from "./session";
import { wrapOpenAI } from "./wrappers/openai";
import { wrapAnthropic } from "./wrappers/anthropic";
import { wrapVercelAI } from "./wrappers/vercel-ai";
import { wrapGemini } from "./wrappers/gemini";
import { wrapMistral } from "./wrappers/mistral";
import type {
  ClientOptions,
  Client,
  SessionOptions,
  TrackEventInput,
  Result,
  WrapperOptions,
  VercelAIFunctions,
} from "./types";

const DEFAULT_BASE_URL = "https://agentreceipt.com";

export function createClient(options: ClientOptions): Client {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const ingest = createIngestClient(options.apiKey, baseUrl);

  return {
    startSession(name?: string, options?: SessionOptions) {
      return createSession(ingest, name, options?.context);
    },

    async track(
      sessionId: string,
      event: TrackEventInput,
    ): Promise<Result<string>> {
      return ingest.send({ sessionId, event });
    },

    wrapOpenAI<T extends object>(client: T, opts?: WrapperOptions): T {
      return wrapOpenAI(client, ingest, opts);
    },

    wrapAnthropic<T extends object>(client: T, opts?: WrapperOptions): T {
      return wrapAnthropic(client, ingest, opts);
    },

    wrapVercelAI<T extends VercelAIFunctions>(
      fns: T,
      opts?: WrapperOptions,
    ): T {
      return wrapVercelAI(fns, ingest, opts);
    },

    wrapGemini<T extends object>(client: T, opts?: WrapperOptions): T {
      return wrapGemini(client, ingest, opts);
    },

    wrapMistral<T extends object>(client: T, opts?: WrapperOptions): T {
      return wrapMistral(client, ingest, opts);
    },
  };
}
