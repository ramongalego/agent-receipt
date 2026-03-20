import { createSession } from "./session";
import { createIngestClient } from "./ingest";
import type { IngestClient } from "./types";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Session", () => {
  let ingest: IngestClient;

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { eventId: "ev_123", sessionId: "s_123" } }),
    });
    ingest = createIngestClient("ar_test", "http://localhost:3000");
  });

  afterEach(() => {
    ingest.destroy();
  });

  it("generates a valid UUID on creation", () => {
    const session = createSession(ingest);
    expect(session.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("stores the session name", () => {
    const session = createSession(ingest, "Test Session");
    expect(session.name).toBe("Test Session");
  });

  it("trackTool calls the wrapped function and returns its result unchanged", async () => {
    const session = createSession(ingest);
    const result = await session.trackTool("test-tool", { a: 1 }, async () => {
      return { success: true };
    });
    expect(result).toEqual({ success: true });
  });

  it("trackTool sends event even if ingest API returns a non-200 response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: "Internal Server Error",
      json: async () => ({ error: "Server error" }),
    });

    const session = createSession(ingest);
    const result = await session.trackTool("test-tool", {}, async () => 42);
    expect(result).toBe(42);
  });

  it("trackTool does not throw if ingest API is unreachable", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const session = createSession(ingest);
    const result = await session.trackTool("test-tool", {}, async () => 42);
    expect(result).toBe(42);
  });

  it("trackTool rethrows errors from the wrapped function", async () => {
    const session = createSession(ingest);
    await expect(
      session.trackTool("test-tool", {}, async () => {
        throw new Error("tool failed");
      }),
    ).rejects.toThrow("tool failed");
  });

  describe("compliance metadata", () => {
    it("trackTool passes compliance metadata through to the ingest call", async () => {
      const session = createSession(ingest, "Test");

      await session.trackTool(
        "read-patient-record",
        { patientId: "123" },
        async () => ({ data: "sensitive" }),
        { compliance: { containsPII: true, dataCategory: "health" } },
      );

      await session.end();

      expect(mockFetch).toHaveBeenCalled();
      const calls = mockFetch.mock.calls;
      const lastCall = calls[calls.length - 1];
      const body = JSON.parse(lastCall[1].body);

      const payload = Array.isArray(body) ? body[body.length - 1] : body;
      expect(payload.event.compliance).toEqual({
        containsPII: true,
        dataCategory: "health",
      });
    });
  });

  describe("trackHumanReview", () => {
    it("sends event with correct type and metadata", async () => {
      const session = createSession(ingest, "Test");

      await session.trackHumanReview({
        reviewer: "sarah@acmecorp.com",
        decision: "approved",
        notes: "Looks good",
      });

      // Flush to ensure the event is sent
      await session.end();

      expect(mockFetch).toHaveBeenCalled();
      const calls = mockFetch.mock.calls;
      const lastCall = calls[calls.length - 1];
      const body = JSON.parse(lastCall[1].body);

      // The batch sends an array of payloads
      const payload = Array.isArray(body) ? body[body.length - 1] : body;
      expect(payload.event.type).toBe("human_review");
      expect(payload.event.name).toBe("human_review");
      expect(payload.event.durationMs).toBe(0);
      expect(payload.event.metadata.reviewer).toBe("sarah@acmecorp.com");
      expect(payload.event.metadata.decision).toBe("approved");
      expect(payload.event.metadata.notes).toBe("Looks good");
    });

    it("does not throw if ingest fails", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const session = createSession(ingest);
      await expect(
        session.trackHumanReview({
          reviewer: "test@example.com",
          decision: "rejected",
        }),
      ).resolves.not.toThrow();
    });

    it("sends empty strings for input and output (no R2 upload needed)", async () => {
      const session = createSession(ingest, "Test");

      await session.trackHumanReview({
        reviewer: "test@example.com",
        decision: "modified",
      });

      await session.end();

      expect(mockFetch).toHaveBeenCalled();
      const calls = mockFetch.mock.calls;
      const lastCall = calls[calls.length - 1];
      const body = JSON.parse(lastCall[1].body);

      const payload = Array.isArray(body) ? body[body.length - 1] : body;
      expect(payload.event.input).toBe("");
      expect(payload.event.output).toBe("");
    });
  });
});
