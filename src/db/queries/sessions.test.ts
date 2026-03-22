/**
 * @jest-environment node
 */

const mockDbSelect = jest.fn();
const mockDbUpdate = jest.fn();
const mockDbSet = jest.fn();
const mockDbUpdateWhere = jest.fn();
const mockDbFrom = jest.fn();
const mockDbInnerJoin = jest.fn();
const mockDbInnerJoin2 = jest.fn();
const mockDbWhere = jest.fn();
const mockDbLimit = jest.fn();
const mockDbThen = jest.fn();
const mockDbOrderBy = jest.fn();

const mockRandomBytes = jest.fn();

jest.mock("crypto", () => ({
  randomBytes: (...args: unknown[]) => mockRandomBytes(...args),
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
                innerJoin: (...j2Args: unknown[]) => {
                  mockDbInnerJoin2(...j2Args);
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
                    orderBy: (...oArgs: unknown[]) => {
                      mockDbOrderBy(...oArgs);
                      return Promise.resolve([]);
                    },
                  };
                },
              };
            },
            where: (...wArgs: unknown[]) => {
              mockDbWhere(...wArgs);
              return {
                orderBy: (...oArgs: unknown[]) => {
                  mockDbOrderBy(...oArgs);
                  return Promise.resolve([]);
                },
              };
            },
          };
        },
      };
    },
    update: (...args: unknown[]) => {
      mockDbUpdate(...args);
      return {
        set: (...sArgs: unknown[]) => {
          mockDbSet(...sArgs);
          return {
            where: (...wArgs: unknown[]) => {
              mockDbUpdateWhere(...wArgs);
              return Promise.resolve();
            },
          };
        },
      };
    },
  },
}));

jest.mock("@/db/schema", () => ({
  agentSessions: {
    id: "id",
    projectId: "project_id",
    shareToken: "share_token",
  },
  events: { id: "id", sessionId: "session_id", type: "type", name: "name" },
  projects: { id: "id", teamId: "team_id" },
  teams: { id: "id", name: "name" },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  and: jest.fn(),
  desc: jest.fn(),
  asc: jest.fn(),
  sql: jest.fn(),
  count: jest.fn(),
}));

import {
  generateShareToken,
  revokeShareToken,
  getSessionByShareToken,
} from "./sessions";

describe("generateShareToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("generates a token and returns it", async () => {
    // Session exists, no existing token
    mockDbThen.mockImplementationOnce((fn: (rows: unknown[]) => unknown) =>
      Promise.resolve(fn([{ id: "session-1", shareToken: null }])),
    );
    mockRandomBytes.mockReturnValue({
      toString: () => "abc123def456ghi789jkl012",
    });

    const token = await generateShareToken("session-1", "team-1");

    expect(token).toBe("abc123def456ghi789jkl012");
    expect(mockDbUpdate).toHaveBeenCalled();
    expect(mockDbSet).toHaveBeenCalledWith(
      expect.objectContaining({ shareToken: "abc123def456ghi789jkl012" }),
    );
  });

  it("returns existing token without generating a new one (idempotent)", async () => {
    mockDbThen.mockImplementationOnce((fn: (rows: unknown[]) => unknown) =>
      Promise.resolve(fn([{ id: "session-1", shareToken: "existing-token" }])),
    );

    const token = await generateShareToken("session-1", "team-1");

    expect(token).toBe("existing-token");
    expect(mockDbUpdate).not.toHaveBeenCalled();
    expect(mockRandomBytes).not.toHaveBeenCalled();
  });

  it("returns null if session does not belong to team", async () => {
    mockDbThen.mockImplementationOnce((fn: (rows: unknown[]) => unknown) =>
      Promise.resolve(fn([])),
    );

    const token = await generateShareToken("session-1", "wrong-team");

    expect(token).toBeNull();
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });
});

describe("revokeShareToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("clears the token and returns true", async () => {
    mockDbThen.mockImplementationOnce((fn: (rows: unknown[]) => unknown) =>
      Promise.resolve(fn([{ id: "session-1" }])),
    );

    const result = await revokeShareToken("session-1", "team-1");

    expect(result).toBe(true);
    expect(mockDbSet).toHaveBeenCalledWith({
      shareToken: null,
      shareTokenCreatedAt: null,
    });
  });

  it("returns false if session does not belong to team", async () => {
    mockDbThen.mockImplementationOnce((fn: (rows: unknown[]) => unknown) =>
      Promise.resolve(fn([])),
    );

    const result = await revokeShareToken("session-1", "wrong-team");

    expect(result).toBe(false);
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });
});

describe("getSessionByShareToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns session and events for a valid token", async () => {
    const mockSession = {
      id: "session-1",
      name: "Test Session",
      status: "completed",
      startedAt: new Date(),
      completedAt: null,
      explicitlyCompletedAt: null,
      summary: null,
      rekorUuid: null,
      rekorLogIndex: null,
      rekorStatus: null,
      projectName: "My Project",
      teamName: "My Team",
    };

    // First call: session lookup
    mockDbThen.mockImplementationOnce((fn: (rows: unknown[]) => unknown) =>
      Promise.resolve(fn([mockSession])),
    );

    const result = await getSessionByShareToken("valid-token");

    expect(result).not.toBeNull();
    expect(result?.session).toEqual(mockSession);
  });

  it("returns null for an invalid token", async () => {
    mockDbThen.mockImplementationOnce((fn: (rows: unknown[]) => unknown) =>
      Promise.resolve(fn([])),
    );

    const result = await getSessionByShareToken("invalid-token");

    expect(result).toBeNull();
  });
});
