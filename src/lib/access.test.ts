const mockThen = jest.fn();
const mockLimit = jest.fn().mockReturnValue({ then: mockThen });
const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });

jest.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

jest.mock("@/db/schema", () => ({
  teams: { id: "id", name: "name", ownerId: "ownerId", createdAt: "createdAt" },
  teamMembers: {
    id: "id",
    teamId: "teamId",
    userId: "userId",
    role: "role",
  },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn((a: unknown, b: unknown) => ({ eq: [a, b] })),
  and: jest.fn((...args: unknown[]) => ({ and: args })),
}));

import { assertTeamMember, assertOwner, getUserRole } from "./access";

describe("access control", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLimit.mockReturnValue({ then: mockThen });
    mockWhere.mockReturnValue({ limit: mockLimit });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  describe("assertTeamMember", () => {
    it("does not throw when user is a member", async () => {
      mockThen.mockImplementation((cb: (rows: unknown[]) => unknown) =>
        Promise.resolve(cb([{ id: "membership-1" }])),
      );

      await expect(
        assertTeamMember("user-1", "team-1"),
      ).resolves.toBeUndefined();
    });

    it("throws when user is not a member", async () => {
      mockThen.mockImplementation((cb: (rows: unknown[]) => unknown) =>
        Promise.resolve(cb([])),
      );

      await expect(assertTeamMember("user-1", "team-1")).rejects.toThrow(
        "You are not a member of this team.",
      );
    });
  });

  describe("assertOwner", () => {
    it("does not throw when user is an owner", async () => {
      mockThen.mockImplementation((cb: (rows: unknown[]) => unknown) =>
        Promise.resolve(cb([{ role: "owner" }])),
      );

      await expect(assertOwner("user-1", "team-1")).resolves.toBeUndefined();
    });

    it("throws when user is a viewer", async () => {
      mockThen.mockImplementation((cb: (rows: unknown[]) => unknown) =>
        Promise.resolve(cb([{ role: "viewer" }])),
      );

      await expect(assertOwner("user-1", "team-1")).rejects.toThrow(
        "You must be an owner to perform this action.",
      );
    });

    it("throws when user is not a member at all", async () => {
      mockThen.mockImplementation((cb: (rows: unknown[]) => unknown) =>
        Promise.resolve(cb([])),
      );

      await expect(assertOwner("user-1", "team-1")).rejects.toThrow(
        "You must be an owner to perform this action.",
      );
    });
  });

  describe("getUserRole", () => {
    it("returns the role when user is a member", async () => {
      mockThen.mockImplementation((cb: (rows: unknown[]) => unknown) =>
        Promise.resolve(cb([{ role: "viewer" }])),
      );

      const role = await getUserRole("user-1", "team-1");
      expect(role).toBe("viewer");
    });

    it("throws when user is not a member", async () => {
      mockThen.mockImplementation((cb: (rows: unknown[]) => unknown) =>
        Promise.resolve(cb([])),
      );

      await expect(getUserRole("user-1", "team-1")).rejects.toThrow(
        "User is not a member of this team.",
      );
    });
  });
});
