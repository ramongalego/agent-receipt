import { createIngestClient } from "./ingest";
import { createSession } from "./session";
import { wrapOpenAI } from "./wrappers/openai";
import { wrapAnthropic } from "./wrappers/anthropic";
import type {
  ClientOptions,
  Client,
  TrackEventInput,
  Result,
  WrapperOptions,
} from "./types";

const DEFAULT_BASE_URL = "https://agentreceipt.com";

export function createClient(options: ClientOptions): Client {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const ingest = createIngestClient(options.apiKey, baseUrl);

  return {
    startSession(name?: string) {
      return createSession(ingest, name);
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
  };
}
