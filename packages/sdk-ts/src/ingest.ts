import type {
  IngestPayload,
  IngestResponse,
  IngestClient,
  Result,
} from "./types";

const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 2000;

export function createIngestClient(
  apiKey: string,
  baseUrl: string,
): IngestClient {
  const queue: IngestPayload[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  async function flush(): Promise<Result<string>> {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }

    const batch = queue.splice(0);
    if (batch.length === 0) {
      return { ok: true, value: "empty" };
    }

    const results: Result<string>[] = [];

    for (const payload of batch) {
      try {
        const res = await fetch(`${baseUrl}/api/ingest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as IngestResponse;
          console.warn(
            `[AgentReceipt] Ingest failed: ${body.error ?? res.statusText}`,
          );
          results.push({
            ok: false,
            error: new Error(body.error ?? res.statusText),
          });
        } else {
          const body = (await res.json()) as IngestResponse;
          results.push({
            ok: true,
            value: body.data?.eventId ?? "ok",
          });
        }
      } catch (e) {
        // Never throw. Log and continue.
        console.warn(
          `[AgentReceipt] Ingest failed: ${e instanceof Error ? e.message : "unknown error"}`,
        );
        results.push({
          ok: false,
          error: e instanceof Error ? e : new Error("unknown error"),
        });
      }
    }

    // Return the result of the last item (most relevant to caller)
    return results[results.length - 1];
  }

  async function send(payload: IngestPayload): Promise<Result<string>> {
    queue.push(payload);

    if (queue.length >= BATCH_SIZE) {
      return flush();
    }

    if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flush().catch(() => {
          // Never throw from background flush
        });
      }, FLUSH_INTERVAL_MS);
    }

    return { ok: true, value: "queued" };
  }

  function getQueueLength(): number {
    return queue.length;
  }

  function destroy(): void {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  }

  return { send, flush, getQueueLength, destroy };
}
