import { randomUUID } from "crypto";
import type { IngestClient, Session, TrackEventInput } from "./types";

export function createSession(ingest: IngestClient, name?: string): Session {
  const id = randomUUID();

  async function trackTool<T>(
    toolName: string,
    input: unknown,
    fn: () => Promise<T>,
  ): Promise<T> {
    const start = Date.now();
    let output: unknown;
    let error: unknown;

    try {
      const result = await fn();
      output = result;
      return result;
    } catch (e) {
      error = e;
      throw e;
    } finally {
      const durationMs = Date.now() - start;
      const event: TrackEventInput = {
        type: error ? "error" : "tool_call",
        name: toolName,
        input,
        output: error
          ? { error: error instanceof Error ? error.message : String(error) }
          : output,
        durationMs,
      };

      // Fire and forget. Never block the caller.
      ingest
        .send({
          sessionId: id,
          sessionName: name,
          event,
        })
        .catch(() => {
          // Silently ignore ingest errors
        });
    }
  }

  async function trackDecision(
    decisionName: string,
    reasoning: string,
    outcome: string,
  ): Promise<void> {
    await ingest
      .send({
        sessionId: id,
        sessionName: name,
        event: {
          type: "decision",
          name: decisionName,
          input: { reasoning },
          output: { outcome },
          durationMs: 0,
        },
      })
      .catch(() => {
        // Silently ignore ingest errors
      });
  }

  async function end(): Promise<void> {
    await ingest.flush();
  }

  return {
    get id() {
      return id;
    },
    get name() {
      return name;
    },
    trackTool,
    trackDecision,
    end,
  };
}
