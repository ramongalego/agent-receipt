"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIngestClient = createIngestClient;
const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 2000;
function createIngestClient(apiKey, baseUrl) {
    const queue = [];
    let flushTimer = null;
    async function flush() {
        if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = null;
        }
        const batch = queue.splice(0);
        if (batch.length === 0) {
            return { ok: true, value: "empty" };
        }
        const results = [];
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
                    const body = (await res.json().catch(() => ({})));
                    console.warn(`[AgentReceipt] Ingest failed: ${body.error ?? res.statusText}`);
                    results.push({
                        ok: false,
                        error: new Error(body.error ?? res.statusText),
                    });
                }
                else {
                    const body = (await res.json());
                    results.push({
                        ok: true,
                        value: body.data?.eventId ?? "ok",
                    });
                }
            }
            catch (e) {
                // Never throw. Log and continue.
                console.warn(`[AgentReceipt] Ingest failed: ${e instanceof Error ? e.message : "unknown error"}`);
                results.push({
                    ok: false,
                    error: e instanceof Error ? e : new Error("unknown error"),
                });
            }
        }
        // Return the result of the last item (most relevant to caller)
        return results[results.length - 1];
    }
    async function send(payload) {
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
    function getQueueLength() {
        return queue.length;
    }
    function destroy() {
        if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = null;
        }
    }
    return { send, flush, getQueueLength, destroy };
}
