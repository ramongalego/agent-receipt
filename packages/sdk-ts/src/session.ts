import { randomUUID } from "crypto";
import type {
  IngestClient,
  Session,
  TrackEventInput,
  TrackOptions,
  HumanReviewParams,
} from "./types";

export function createSession(ingest: IngestClient, name?: string): Session {
  const id = randomUUID();

  async function trackTool<T>(
    toolName: string,
    input: unknown,
    fn: () => Promise<T>,
    options?: TrackOptions,
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
        compliance: options?.compliance,
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
    options?: TrackOptions,
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
          compliance: options?.compliance,
        },
      })
      .catch(() => {
        // Silently ignore ingest errors
      });
  }

  async function trackHumanReview(
    params: HumanReviewParams & TrackOptions,
  ): Promise<void> {
    const metadata: Record<string, unknown> = {
      reviewer: params.reviewer,
      decision: params.decision,
    };
    if (params.notes !== undefined) {
      metadata.notes = params.notes;
    }

    await ingest
      .send({
        sessionId: id,
        sessionName: name,
        event: {
          type: "human_review",
          name: "human_review",
          input: "",
          output: "",
          durationMs: 0,
          metadata,
          compliance: params.compliance,
        },
      })
      .catch(() => {
        // Silently ignore ingest errors
      });
  }

  async function end(): Promise<void> {
    await ingest.flush();

    // Send explicit session completion marker
    await ingest
      .send({
        sessionId: id,
        sessionName: name,
        event: {
          type: "decision",
          name: "session.end",
          input: { reasoning: "Session explicitly ended by SDK" },
          output: { outcome: "complete" },
          durationMs: 0,
        },
      })
      .catch(() => {
        // Silently ignore ingest errors
      });

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
    trackHumanReview,
    end,
  };
}
