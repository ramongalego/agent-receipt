/**
 * @jest-environment node
 */

const mockAuth = jest.fn();
const mockGetUserTeam = jest.fn();
const mockGetPayload = jest.fn();

const mockDbSelect = jest.fn();
const mockDbInnerJoin = jest.fn();
const mockDbInnerJoin2 = jest.fn();
const mockDbWhere = jest.fn();
const mockDbLimit = jest.fn();
const mockDbThen = jest.fn();

jest.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));
jest.mock("@/lib/access", () => ({
  getUserTeam: (userId: string) => mockGetUserTeam(userId),
}));
jest.mock("@/lib/r2", () => ({
  getPayload: (eventId: string) => mockGetPayload(eventId),
}));
jest.mock("@/db/queries/sessions", () => ({
  updateSessionSummary: jest.fn(),
}));
jest.mock("@/db", () => ({
  db: {
    select: () => {
      mockDbSelect();
      return {
        from: () => ({
          innerJoin: () => {
            mockDbInnerJoin();
            return {
              innerJoin: () => {
                mockDbInnerJoin2();
                return {
                  where: () => {
                    mockDbWhere();
                    return {
                      limit: () => {
                        mockDbLimit();
                        return {
                          then: (fn: (rows: unknown[]) => unknown) =>
                            mockDbThen(fn),
                        };
                      },
                    };
                  },
                };
              },
              where: () => {
                mockDbWhere();
                return {
                  limit: () => {
                    mockDbLimit();
                    return {
                      then: (fn: (rows: unknown[]) => unknown) =>
                        mockDbThen(fn),
                    };
                  },
                };
              },
            };
          },
        }),
      };
    },
  },
}));
jest.mock("@/db/schema", () => ({
  events: {},
  agentSessions: {},
  projects: {},
}));
jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  and: jest.fn(),
}));

import { fetchEventPayload, generateSessionSummary } from "./actions";

describe("fetchEventPayload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns UNAUTHORIZED when user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await fetchEventPayload("evt_1");

    expect(result).toEqual({
      error: "Not authenticated.",
      code: "UNAUTHORIZED",
    });
  });

  it("returns FORBIDDEN when event belongs to another team", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user_A" } });
    mockGetUserTeam.mockResolvedValue({ id: "team_A", name: "Team A" });
    // DB returns no rows — event does not belong to team_A
    mockDbThen.mockImplementation((fn: (rows: unknown[]) => unknown) =>
      Promise.resolve(fn([])),
    );

    const result = await fetchEventPayload("evt_from_team_B");

    expect(result).toEqual({
      error: "You do not have access to this event.",
      code: "FORBIDDEN",
    });
    expect(mockGetPayload).not.toHaveBeenCalled();
  });

  it("returns payload when event belongs to the user's team", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user_A" } });
    mockGetUserTeam.mockResolvedValue({ id: "team_A", name: "Team A" });
    // DB returns a row — event belongs to team_A
    mockDbThen.mockImplementation((fn: (rows: unknown[]) => unknown) =>
      Promise.resolve(fn([{ id: "evt_1" }])),
    );
    mockGetPayload.mockResolvedValue({
      ok: true,
      value: { input: "test", output: "result" },
    });

    const result = await fetchEventPayload("evt_1");

    expect(result).toEqual({
      data: { input: "test", output: "result" },
    });
    expect(mockGetPayload).toHaveBeenCalledWith("evt_1");
  });
});

describe("generateSessionSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns FORBIDDEN when session belongs to another team", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user_A" } });
    mockGetUserTeam.mockResolvedValue({ id: "team_A", name: "Team A" });
    // DB returns no rows — session does not belong to team_A
    mockDbThen.mockImplementation((fn: (rows: unknown[]) => unknown) =>
      Promise.resolve(fn([])),
    );

    const result = await generateSessionSummary("session_from_team_B", null, [
      { id: "evt_1", type: "llm_call", name: "Parse", durationMs: 100 },
    ]);

    expect(result).toEqual({
      error: "You do not have access to this session.",
      code: "FORBIDDEN",
    });
  });
});
