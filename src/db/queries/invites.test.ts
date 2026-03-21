/**
 * @jest-environment node
 */

const mockThen = jest.fn();
const mockLimit = jest.fn().mockReturnValue({ then: mockThen });
const mockWhere = jest.fn().mockReturnValue({
  limit: mockLimit,
  then: mockThen,
});
const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere });
const mockFrom = jest.fn().mockReturnValue({
  where: mockWhere,
  innerJoin: mockInnerJoin,
});
const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });

const mockReturning = jest.fn().mockReturnValue({ then: mockThen });
const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
const mockInsert = jest.fn().mockReturnValue({ values: mockValues });

const mockSet = jest.fn().mockReturnValue({
  where: jest.fn().mockReturnValue({ returning: mockReturning }),
});
const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });

const mockDeleteWhere = jest.fn().mockResolvedValue([]);
const mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });

jest.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

jest.mock("@/db/schema", () => ({
  inviteTokens: {
    id: "id",
    teamId: "teamId",
    email: "email",
    role: "role",
    token: "token",
    invitedBy: "invitedBy",
    acceptedAt: "acceptedAt",
    expiresAt: "expiresAt",
  },
  teamMembers: {
    id: "id",
    teamId: "teamId",
    userId: "userId",
    role: "role",
    invitedBy: "invitedBy",
  },
  teams: { id: "id", name: "name" },
  users: { id: "id", email: "email" },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn((a: unknown, b: unknown) => ({ eq: [a, b] })),
  and: jest.fn((...args: unknown[]) => ({ and: args })),
  isNull: jest.fn((a: unknown) => ({ isNull: a })),
}));

import { createInvite, getInviteByToken, acceptInvite } from "./invites";

describe("invite queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLimit.mockReturnValue({ then: mockThen });
    mockWhere.mockReturnValue({ limit: mockLimit, then: mockThen });
    mockInnerJoin.mockReturnValue({ where: mockWhere });
    mockFrom.mockReturnValue({ where: mockWhere, innerJoin: mockInnerJoin });
    mockSelect.mockReturnValue({ from: mockFrom });
    mockDeleteWhere.mockResolvedValue([]);
  });

  describe("createInvite", () => {
    it("generates a token and sets expiry 7 days out", async () => {
      const now = Date.now();
      mockReturning.mockResolvedValue([
        {
          id: "inv-1",
          teamId: "team-1",
          email: "user@example.com",
          role: "viewer",
          token: "abc123",
          expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
        },
      ]);

      const result = await createInvite(
        "team-1",
        "user@example.com",
        "viewer",
        "inviter-1",
      );

      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe("string");
      expect(result.token.length).toBe(64); // 32 bytes = 64 hex chars
      expect(mockInsert).toHaveBeenCalled();

      // Check values passed to insert include an expiresAt ~7 days from now
      const insertValues = mockValues.mock.calls[0][0];
      expect(insertValues.teamId).toBe("team-1");
      expect(insertValues.email).toBe("user@example.com");
      expect(insertValues.role).toBe("viewer");
      expect(insertValues.invitedBy).toBe("inviter-1");

      const expiresAt = insertValues.expiresAt as Date;
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const diff = expiresAt.getTime() - now;
      // Should be within 5 seconds of 7 days from now
      expect(diff).toBeGreaterThan(sevenDaysMs - 5000);
      expect(diff).toBeLessThan(sevenDaysMs + 5000);
    });
  });

  describe("getInviteByToken", () => {
    it("returns null for expired tokens", async () => {
      mockThen.mockImplementation((cb: (rows: unknown[]) => unknown) =>
        Promise.resolve(
          cb([
            {
              id: "inv-1",
              teamId: "team-1",
              email: "user@example.com",
              role: "viewer",
              token: "abc123",
              invitedBy: "inviter-1",
              acceptedAt: null,
              expiresAt: new Date("2020-01-01"), // expired
              teamName: "Test Team",
            },
          ]),
        ),
      );

      const result = await getInviteByToken("abc123");
      expect(result).toBeNull();
    });

    it("returns null for already-accepted tokens", async () => {
      mockThen.mockImplementation((cb: (rows: unknown[]) => unknown) =>
        Promise.resolve(
          cb([
            {
              id: "inv-1",
              teamId: "team-1",
              email: "user@example.com",
              role: "viewer",
              token: "abc123",
              invitedBy: "inviter-1",
              acceptedAt: new Date(), // already accepted
              expiresAt: new Date("2030-01-01"),
              teamName: "Test Team",
            },
          ]),
        ),
      );

      const result = await getInviteByToken("abc123");
      expect(result).toBeNull();
    });

    it("returns the invite when token is valid", async () => {
      mockThen.mockImplementation((cb: (rows: unknown[]) => unknown) =>
        Promise.resolve(
          cb([
            {
              id: "inv-1",
              teamId: "team-1",
              email: "user@example.com",
              role: "viewer",
              token: "abc123",
              invitedBy: "inviter-1",
              acceptedAt: null,
              expiresAt: new Date("2030-01-01"),
              teamName: "Test Team",
            },
          ]),
        ),
      );

      const result = await getInviteByToken("abc123");
      expect(result).not.toBeNull();
      expect(result!.teamId).toBe("team-1");
      expect(result!.email).toBe("user@example.com");
      expect(result!.teamName).toBe("Test Team");
    });

    it("returns null when token does not exist", async () => {
      mockThen.mockImplementation((cb: (rows: unknown[]) => unknown) =>
        Promise.resolve(cb([])),
      );

      const result = await getInviteByToken("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("acceptInvite", () => {
    it("creates a team_members row with correct role", async () => {
      // getInviteByToken call
      let callCount = 0;
      mockThen.mockImplementation((cb: (rows: unknown[]) => unknown) => {
        callCount++;
        if (callCount === 1) {
          // getInviteByToken SELECT
          return Promise.resolve(
            cb([
              {
                id: "inv-1",
                teamId: "team-1",
                email: "user@example.com",
                role: "viewer",
                token: "abc123",
                invitedBy: "inviter-1",
                acceptedAt: null,
                expiresAt: new Date("2030-01-01"),
                teamName: "Test Team",
              },
            ]),
          );
        }
        return Promise.resolve(cb([]));
      });

      // Mock update for acceptedAt
      const mockUpdateWhere = jest.fn().mockResolvedValue(undefined);
      mockSet.mockReturnValue({ where: mockUpdateWhere });

      // Mock insert for team_members
      mockReturning.mockResolvedValue([
        {
          id: "member-1",
          teamId: "team-1",
          userId: "new-user",
          role: "viewer",
          invitedBy: "inviter-1",
        },
      ]);

      const result = await acceptInvite("abc123", "new-user");

      expect(result).not.toBeNull();
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();

      // Check the team_members insert values
      const memberValues = mockValues.mock.calls[0][0];
      expect(memberValues.teamId).toBe("team-1");
      expect(memberValues.userId).toBe("new-user");
      expect(memberValues.role).toBe("viewer");
      expect(memberValues.invitedBy).toBe("inviter-1");
    });
  });
});
