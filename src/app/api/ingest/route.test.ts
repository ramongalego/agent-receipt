/**
 * @jest-environment node
 */

// Mock external modules before any imports to prevent neon/drizzle from loading
jest.mock("@/db", () => {
  const chainable = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: jest.fn(),
  };
  return { db: chainable };
});

jest.mock("@/db/schema", () => ({
  projects: { id: "id", userId: "user_id" },
}));

jest.mock("@/lib/ingest", () => ({
  validateApiKey: jest.fn(),
  processIngestEvent: jest.fn(),
  insertSystemErrorEvent: jest.fn(),
}));

jest.mock("@/lib/billing", () => ({
  isOverLimit: jest.fn(),
  MAX_EVENTS_PER_SESSION: 200,
}));

jest.mock("@/db/queries/events", () => ({
  getEventCountBySessionId: jest.fn(),
}));

jest.mock("@/lib/r2", () => ({
  checkR2Config: jest.fn().mockReturnValue({ ok: true }),
}));

import { NextRequest } from "next/server";
import { POST } from "./route";
import {
  validateApiKey,
  processIngestEvent,
  insertSystemErrorEvent,
} from "@/lib/ingest";
import { isOverLimit } from "@/lib/billing";
import { getEventCountBySessionId } from "@/db/queries/events";
import { db } from "@/db";

const mockValidateApiKey = validateApiKey as jest.MockedFunction<
  typeof validateApiKey
>;
const mockProcessIngestEvent = processIngestEvent as jest.MockedFunction<
  typeof processIngestEvent
>;
const mockIsOverLimit = isOverLimit as jest.MockedFunction<typeof isOverLimit>;
const mockInsertSystemErrorEvent =
  insertSystemErrorEvent as jest.MockedFunction<typeof insertSystemErrorEvent>;
const mockGetEventCount = getEventCountBySessionId as jest.MockedFunction<
  typeof getEventCountBySessionId
>;
const mockDb = db as unknown as {
  select: jest.Mock;
  from: jest.Mock;
  where: jest.Mock;
  limit: jest.Mock;
  then: jest.Mock;
};

function createRequest(options: {
  body?: unknown;
  headers?: Record<string, string>;
  invalidJson?: boolean;
}): NextRequest {
  const { body, headers = {}, invalidJson = false } = options;

  return new NextRequest("http://localhost/api/ingest", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: invalidJson ? "not valid json{{{" : JSON.stringify(body ?? {}),
  });
}

const VALID_API_KEY = "ar_live_test123abc";

const VALID_BODY = {
  sessionId: "550e8400-e29b-41d4-a716-446655440000",
  sessionName: "Process invoice #441",
  event: {
    type: "tool_call" as const,
    name: "send-email",
    input: { to: "user@example.com", subject: "Hello" },
    output: { success: true },
    durationMs: 120,
    metadata: { retries: 1 },
  },
};

const VALID_KEY_RESULT = {
  ok: true as const,
  value: {
    projectId: "proj-123",
    keyId: "key-456",
  },
};

const VALID_PROCESS_RESULT = {
  ok: true as const,
  value: {
    eventId: "evt-789",
    sessionId: VALID_BODY.sessionId,
  },
};

function setupHappyPath() {
  mockValidateApiKey.mockResolvedValue(VALID_KEY_RESULT);
  mockDb.then.mockResolvedValue({ userId: "user-001" });
  mockIsOverLimit.mockResolvedValue(false);
  mockGetEventCount.mockResolvedValue(0);
  mockProcessIngestEvent.mockResolvedValue(VALID_PROCESS_RESULT);
}

beforeEach(() => {
  jest.clearAllMocks();
  // Reset the chainable db mock so .then resolves correctly per test
  mockDb.select.mockReturnThis();
  mockDb.from.mockReturnThis();
  mockDb.where.mockReturnThis();
  mockDb.limit.mockReturnThis();
});

describe("POST /api/ingest", () => {
  describe("authentication", () => {
    it("returns 401 when Authorization header is missing", async () => {
      const req = createRequest({ body: VALID_BODY });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.code).toBe("UNAUTHORIZED");
      expect(json.error).toMatch(/Authorization header/);
    });

    it("returns 401 when Authorization header does not start with Bearer", async () => {
      const req = createRequest({
        body: VALID_BODY,
        headers: { authorization: "Basic abc123" },
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.code).toBe("UNAUTHORIZED");
    });

    it("returns 401 when the API key is invalid", async () => {
      mockValidateApiKey.mockResolvedValue({
        ok: false,
        error: "Invalid or revoked API key.",
        code: "INVALID_API_KEY",
      });

      const req = createRequest({
        body: VALID_BODY,
        headers: { authorization: "Bearer ar_bad_key" },
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.code).toBe("INVALID_API_KEY");
      expect(json.error).toMatch(/Invalid or revoked/);
    });

    it("returns 401 when the API key has been revoked", async () => {
      mockValidateApiKey.mockResolvedValue({
        ok: false,
        error: "Invalid or revoked API key.",
        code: "INVALID_API_KEY",
      });

      const req = createRequest({
        body: VALID_BODY,
        headers: { authorization: `Bearer ${VALID_API_KEY}` },
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.code).toBe("INVALID_API_KEY");
    });
  });

  describe("billing limits", () => {
    it("returns 429 when user is over their monthly session limit", async () => {
      mockValidateApiKey.mockResolvedValue(VALID_KEY_RESULT);
      mockDb.then.mockResolvedValue({ userId: "user-001" });
      mockIsOverLimit.mockResolvedValue(true);

      const req = createRequest({
        body: VALID_BODY,
        headers: { authorization: `Bearer ${VALID_API_KEY}` },
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(429);
      expect(json.code).toBe("LIMIT_REACHED");
      expect(json.error).toMatch(/Monthly session limit/);
    });

    it("proceeds when user is under their monthly session limit", async () => {
      setupHappyPath();

      const req = createRequest({
        body: VALID_BODY,
        headers: { authorization: `Bearer ${VALID_API_KEY}` },
      });
      const res = await POST(req);

      expect(res.status).toBe(201);
      expect(mockIsOverLimit).toHaveBeenCalledWith("user-001");
    });

    it("returns 429 and inserts an error event when a session already has 200 events", async () => {
      mockValidateApiKey.mockResolvedValue(VALID_KEY_RESULT);
      mockDb.then.mockResolvedValue({ userId: "user-001" });
      mockIsOverLimit.mockResolvedValue(false);
      mockGetEventCount.mockResolvedValue(200);
      mockInsertSystemErrorEvent.mockResolvedValue(undefined);

      const req = createRequest({
        body: VALID_BODY,
        headers: { authorization: `Bearer ${VALID_API_KEY}` },
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(429);
      expect(json.code).toBe("SESSION_EVENT_LIMIT");
      expect(json.error).toMatch(/Session event limit reached/);
      expect(mockInsertSystemErrorEvent).toHaveBeenCalledWith(
        VALID_BODY.sessionId,
        "session.limit_reached",
        expect.stringContaining("Session event limit reached"),
      );
      expect(mockProcessIngestEvent).not.toHaveBeenCalled();
    });

    it("succeeds when a session has 199 events", async () => {
      mockValidateApiKey.mockResolvedValue(VALID_KEY_RESULT);
      mockDb.then.mockResolvedValue({ userId: "user-001" });
      mockIsOverLimit.mockResolvedValue(false);
      mockGetEventCount.mockResolvedValue(199);
      mockProcessIngestEvent.mockResolvedValue(VALID_PROCESS_RESULT);

      const req = createRequest({
        body: VALID_BODY,
        headers: { authorization: `Bearer ${VALID_API_KEY}` },
      });
      const res = await POST(req);

      expect(res.status).toBe(201);
      expect(mockProcessIngestEvent).toHaveBeenCalled();
    });
  });

  describe("request body validation", () => {
    it("returns 400 when the request body is not valid JSON", async () => {
      mockValidateApiKey.mockResolvedValue(VALID_KEY_RESULT);
      mockDb.then.mockResolvedValue({ userId: "user-001" });
      mockIsOverLimit.mockResolvedValue(false);

      const req = createRequest({
        invalidJson: true,
        headers: { authorization: `Bearer ${VALID_API_KEY}` },
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.code).toBe("INVALID_JSON");
      expect(json.error).toMatch(/valid JSON/);
    });

    it("returns 400 with field errors when body fails validation", async () => {
      mockValidateApiKey.mockResolvedValue(VALID_KEY_RESULT);
      mockDb.then.mockResolvedValue({ userId: "user-001" });
      mockIsOverLimit.mockResolvedValue(false);

      const req = createRequest({
        body: { sessionId: "not-a-uuid", event: {} },
        headers: { authorization: `Bearer ${VALID_API_KEY}` },
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.code).toBe("VALIDATION_ERROR");
      expect(json.error).toBe("Invalid request body.");
      expect(json.details).toBeDefined();
    });

    it("returns 400 when required fields are missing from the event", async () => {
      mockValidateApiKey.mockResolvedValue(VALID_KEY_RESULT);
      mockDb.then.mockResolvedValue({ userId: "user-001" });
      mockIsOverLimit.mockResolvedValue(false);

      const req = createRequest({
        body: {
          sessionId: "550e8400-e29b-41d4-a716-446655440000",
          event: { type: "llm_call" },
        },
        headers: { authorization: `Bearer ${VALID_API_KEY}` },
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.code).toBe("VALIDATION_ERROR");
      expect(json.details).toBeDefined();
    });
  });

  describe("successful ingestion", () => {
    it("stores event and returns eventId with 201 status", async () => {
      setupHappyPath();

      const req = createRequest({
        body: VALID_BODY,
        headers: { authorization: `Bearer ${VALID_API_KEY}` },
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.eventId).toBe("evt-789");
      expect(json.data.sessionId).toBe(VALID_BODY.sessionId);
    });

    it("passes the correct projectId, keyId, and parsed data to processIngestEvent", async () => {
      setupHappyPath();

      const req = createRequest({
        body: VALID_BODY,
        headers: { authorization: `Bearer ${VALID_API_KEY}` },
      });
      await POST(req);

      expect(mockProcessIngestEvent).toHaveBeenCalledTimes(1);
      expect(mockProcessIngestEvent).toHaveBeenCalledWith(
        "proj-123",
        "key-456",
        expect.objectContaining({
          sessionId: VALID_BODY.sessionId,
          sessionName: VALID_BODY.sessionName,
          event: expect.objectContaining({
            type: "tool_call",
            name: "send-email",
            durationMs: 120,
          }),
        }),
      );
    });

    it("validates the API key with the bearer token from the header", async () => {
      setupHappyPath();

      const req = createRequest({
        body: VALID_BODY,
        headers: { authorization: `Bearer ${VALID_API_KEY}` },
      });
      await POST(req);

      expect(mockValidateApiKey).toHaveBeenCalledWith(VALID_API_KEY);
    });
  });

  describe("processing errors", () => {
    it("returns 500 when processIngestEvent fails", async () => {
      mockValidateApiKey.mockResolvedValue(VALID_KEY_RESULT);
      mockDb.then.mockResolvedValue({ userId: "user-001" });
      mockIsOverLimit.mockResolvedValue(false);
      mockProcessIngestEvent.mockResolvedValue({
        ok: false,
        error: "Database write failed.",
        code: "INTERNAL_ERROR",
      });

      const req = createRequest({
        body: VALID_BODY,
        headers: { authorization: `Bearer ${VALID_API_KEY}` },
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.code).toBe("INTERNAL_ERROR");
      expect(json.error).toBe("Database write failed.");
    });
  });
});
