import { createSession } from "./session";
import { createIngestClient } from "./ingest";
import type { IngestClient } from "./types";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper: find a specific event payload across all fetch calls, skipping session.end
function findEventPayload(
  calls: jest.Mock["mock"]["calls"],
  predicate: (p: { event: { name: string; type: string } }) => boolean,
) {
  for (const call of calls) {
    const body = JSON.parse(call[1].body);
    const payloads = Array.isArray(body) ? body : [body];
    for (const payload of payloads) {
      if (predicate(payload)) return payload;
    }
  }
  return null;
}

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

  it("end() sends a session.end event after flushing queued events", async () => {
    const session = createSession(ingest, "Test Session");

    // Track something first
    await session.trackDecision("test-decision", "reason", "outcome");

    // Now end the session
    await session.end();

    // Find the session.end event in the fetch calls
    const calls = mockFetch.mock.calls;
    let foundSessionEnd = false;
    for (const call of calls) {
      const body = JSON.parse(call[1].body);
      const payloads = Array.isArray(body) ? body : [body];
      for (const payload of payloads) {
        if (payload.event?.name === "session.end") {
          expect(payload.event.type).toBe("decision");
          expect(payload.event.input.reasoning).toBe(
            "Session explicitly ended by SDK",
          );
          expect(payload.event.output.outcome).toBe("complete");
          expect(payload.event.durationMs).toBe(0);
          foundSessionEnd = true;
        }
      }
    }
    expect(foundSessionEnd).toBe(true);
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
      const payload = findEventPayload(
        mockFetch.mock.calls,
        (p) => p.event.name === "read-patient-record",
      );
      expect(payload).not.toBeNull();
      expect(payload.event.compliance).toEqual({
        containsPII: true,
        dataCategory: "health",
      });
    });

    it("trackDecision passes compliance metadata through to the ingest call", async () => {
      const session = createSession(ingest, "Test");

      await session.trackDecision(
        "approve-referral",
        "Patient meets criteria",
        "approved",
        { compliance: { containsPII: true, dataCategory: "health" } },
      );

      await session.end();

      expect(mockFetch).toHaveBeenCalled();
      const payload = findEventPayload(
        mockFetch.mock.calls,
        (p) => p.event.name === "approve-referral",
      );
      expect(payload).not.toBeNull();
      expect(payload.event.compliance).toEqual({
        containsPII: true,
        dataCategory: "health",
      });
    });

    it("trackHumanReview passes compliance metadata through to the ingest call", async () => {
      const session = createSession(ingest, "Test");

      await session.trackHumanReview({
        reviewer: "dr.smith@hospital.org",
        decision: "approved",
        compliance: { containsPII: false, dataCategory: "health" },
      });

      await session.end();

      expect(mockFetch).toHaveBeenCalled();
      const payload = findEventPayload(
        mockFetch.mock.calls,
        (p) => p.event.type === "human_review",
      );
      expect(payload).not.toBeNull();
      expect(payload.event.compliance).toEqual({
        containsPII: false,
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
      const payload = findEventPayload(
        mockFetch.mock.calls,
        (p) => p.event.type === "human_review",
      );
      expect(payload).not.toBeNull();
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
      const payload = findEventPayload(
        mockFetch.mock.calls,
        (p) => p.event.type === "human_review",
      );
      expect(payload).not.toBeNull();
      expect(payload.event.input).toBe("");
      expect(payload.event.output).toBe("");
    });
  });
});
