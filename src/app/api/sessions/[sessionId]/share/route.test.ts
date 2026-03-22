/**
 * @jest-environment node
 */

const mockValidateApiKey = jest.fn();
const mockGenerateShareToken = jest.fn();

const mockDbSelect = jest.fn().mockReturnThis();
const mockDbFrom = jest.fn().mockReturnThis();
const mockDbInnerJoin = jest.fn().mockReturnThis();
const mockDbWhere = jest.fn().mockReturnThis();
const mockDbLimit = jest.fn().mockReturnThis();
const mockDbThen = jest.fn();

jest.mock("@/lib/ingest", () => ({
  validateApiKey: (...args: unknown[]) => mockValidateApiKey(...args),
}));

jest.mock("@/db/queries/sessions", () => ({
  generateShareToken: (...args: unknown[]) => mockGenerateShareToken(...args),
}));

jest.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => {
      mockDbSelect(...args);
      return {
        from: (...fArgs: unknown[]) => {
          mockDbFrom(...fArgs);
          return {
            innerJoin: (...jArgs: unknown[]) => {
              mockDbInnerJoin(...jArgs);
              return {
                where: (...wArgs: unknown[]) => {
                  mockDbWhere(...wArgs);
                  return {
                    limit: (...lArgs: unknown[]) => {
                      mockDbLimit(...lArgs);
                      return {
                        then: (fn: (rows: unknown[]) => unknown) =>
                          mockDbThen(fn),
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  },
}));

jest.mock("@/db/schema", () => ({
  agentSessions: { id: "id", projectId: "project_id" },
  projects: { id: "id", teamId: "team_id" },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  and: jest.fn(),
}));

import { NextRequest } from "next/server";
import { POST } from "./route";

function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/sessions/session-1/share", {
    method: "POST",
    headers,
  });
}

const params = Promise.resolve({ sessionId: "session-1" });

describe("POST /api/sessions/[sessionId]/share", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 for missing Authorization header", async () => {
    const res = await POST(makeRequest(), { params });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 for invalid API key", async () => {
    mockValidateApiKey.mockResolvedValue({
      ok: false,
      error: "Invalid or revoked API key.",
      code: "INVALID_API_KEY",
    });

    const res = await POST(
      makeRequest({ Authorization: "Bearer ar_live_bad" }),
      { params },
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.code).toBe("INVALID_API_KEY");
  });

  it("returns 403 if session does not belong to the API key's project", async () => {
    mockValidateApiKey.mockResolvedValue({
      ok: true,
      value: { projectId: "project-1", keyId: "key-1" },
    });
    // DB returns no rows — session not in this project
    mockDbThen.mockImplementation((fn: (rows: unknown[]) => unknown) =>
      Promise.resolve(fn([])),
    );

    const res = await POST(
      makeRequest({ Authorization: "Bearer ar_live_good" }),
      { params },
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
  });

  it("returns share URL for valid request", async () => {
    mockValidateApiKey.mockResolvedValue({
      ok: true,
      value: { projectId: "project-1", keyId: "key-1" },
    });
    mockDbThen.mockImplementation((fn: (rows: unknown[]) => unknown) =>
      Promise.resolve(fn([{ id: "session-1", teamId: "team-1" }])),
    );
    mockGenerateShareToken.mockResolvedValue("generated-token-abc");

    const res = await POST(
      makeRequest({ Authorization: "Bearer ar_live_good" }),
      { params },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.token).toBe("generated-token-abc");
    expect(body.data.url).toContain("/s/generated-token-abc");
    expect(mockGenerateShareToken).toHaveBeenCalledWith("session-1", "team-1");
  });
});
