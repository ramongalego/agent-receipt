/**
 * @jest-environment node
 */

const mockAuth = jest.fn();
const mockGetUserTeam = jest.fn();
const mockAnchorSessionIfEligible = jest.fn();
const mockDbThen = jest.fn();

jest.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));
jest.mock("@/lib/access", () => ({
  getUserTeam: (userId: string) => mockGetUserTeam(userId),
}));
jest.mock("@/lib/anchor-session", () => ({
  anchorSessionIfEligible: (...args: unknown[]) =>
    mockAnchorSessionIfEligible(...args),
}));
jest.mock("@/db", () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              then: (fn: (rows: unknown[]) => unknown) => mockDbThen(fn),
            }),
          }),
        }),
      }),
    }),
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

function createRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/anchor-session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/anchor-session", () => {
  it("returns 401 for unauthenticated requests", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(createRequest({ sessionId: "session-1" }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.code).toBe("UNAUTHORIZED");
    expect(mockAnchorSessionIfEligible).not.toHaveBeenCalled();
  });

  it("returns 403 if session does not belong to caller's team", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetUserTeam.mockResolvedValue({
      id: "team-1",
      name: "Test",
      ownerId: "user-1",
      createdAt: new Date(),
    });
    // DB returns no rows, session not found in team
    mockDbThen.mockImplementation((fn: (rows: unknown[]) => unknown) =>
      Promise.resolve(fn([])),
    );

    const res = await POST(createRequest({ sessionId: "other-session" }));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.code).toBe("FORBIDDEN");
    expect(mockAnchorSessionIfEligible).not.toHaveBeenCalled();
  });

  it("returns 200 and calls anchorSessionIfEligible for valid request", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetUserTeam.mockResolvedValue({
      id: "team-1",
      name: "Test",
      ownerId: "user-1",
      createdAt: new Date(),
    });
    // DB returns the session
    mockDbThen.mockImplementation((fn: (rows: unknown[]) => unknown) =>
      Promise.resolve(fn([{ id: "session-1", projectId: "project-1" }])),
    );
    mockAnchorSessionIfEligible.mockResolvedValue(undefined);

    const res = await POST(createRequest({ sessionId: "session-1" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockAnchorSessionIfEligible).toHaveBeenCalledWith(
      "session-1",
      "project-1",
      "team-1",
    );
  });
});
