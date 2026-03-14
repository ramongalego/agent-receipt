import { createIngestClient } from "./ingest";
import type { IngestClient } from "./types";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("IngestClient", () => {
  let clients: IngestClient[] = [];

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { eventId: "ev_1", sessionId: "s_1" } }),
    });
    clients = [];
  });

  afterEach(() => {
    clients.forEach((c) => c.destroy());
  });

  function makeClient() {
    const c = createIngestClient("ar_test", "http://localhost:3000");
    clients.push(c);
    return c;
  }

  it("queues events instead of sending immediately", async () => {
    const client = makeClient();

    await client.send({
      sessionId: "s_1",
      event: {
        type: "tool_call",
        name: "test",
        input: {},
        output: {},
        durationMs: 100,
      },
    });

    // Event is queued, not yet sent (batch size not reached)
    expect(client.getQueueLength()).toBe(1);
  });

  it("flushes when batch size is reached", async () => {
    const client = makeClient();

    for (let i = 0; i < 10; i++) {
      await client.send({
        sessionId: "s_1",
        event: {
          type: "tool_call",
          name: `tool_${i}`,
          input: {},
          output: {},
          durationMs: 100,
        },
      });
    }

    // After 10 events, batch should have been flushed
    expect(mockFetch).toHaveBeenCalledTimes(10);
    expect(client.getQueueLength()).toBe(0);
  });

  it("flush sends all queued events", async () => {
    const client = makeClient();

    await client.send({
      sessionId: "s_1",
      event: {
        type: "tool_call",
        name: "test",
        input: {},
        output: {},
        durationMs: 100,
      },
    });

    await client.flush();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(client.getQueueLength()).toBe(0);
  });

  it("does not throw when fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const client = makeClient();

    await client.send({
      sessionId: "s_1",
      event: {
        type: "tool_call",
        name: "test",
        input: {},
        output: {},
        durationMs: 100,
      },
    });

    const result = await client.flush();
    expect(result.ok).toBe(false);
  });
});
