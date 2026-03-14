// Mock DB at module boundary to prevent Neon from loading
const mockThen = jest.fn();
const mockLimit = jest.fn().mockReturnValue({ then: mockThen });
const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });

const mockReturning = jest.fn().mockReturnValue({ then: mockThen });
const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
const mockInsert = jest.fn().mockReturnValue({ values: mockValues });

const mockSet = jest.fn().mockReturnValue({
  where: jest.fn().mockReturnValue({ returning: mockReturning }),
});
const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });

const mockDeleteWhere = jest.fn().mockReturnValue({ returning: mockReturning });
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
  projects: { id: "id", userId: "userId", createdAt: "createdAt" },
  apiKeys: { projectId: "projectId", revoked: "revoked", id: "id" },
  agentSessions: { projectId: "projectId", id: "id" },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn((a: unknown, b: unknown) => ({ eq: [a, b] })),
  and: jest.fn((...args: unknown[]) => ({ and: args })),
  sql: jest.fn(),
}));

import {
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "./projects";
import { eq, and } from "drizzle-orm";

describe("project queries scope to userId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLimit.mockReturnValue({ then: mockThen });
    mockWhere.mockReturnValue({ limit: mockLimit });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  it("getProjectById filters by both projectId and userId", async () => {
    mockThen.mockImplementation((cb: (rows: unknown[]) => unknown) =>
      Promise.resolve(cb([{ id: "proj_1", userId: "user_1" }])),
    );

    await getProjectById("proj_1", "user_1");

    expect(and).toHaveBeenCalled();
    const andArgs = (and as jest.Mock).mock.calls[0];
    // First arg: eq(projects.id, projectId)
    expect(eq).toHaveBeenCalledWith("id", "proj_1");
    // Second arg: eq(projects.userId, userId)
    expect(eq).toHaveBeenCalledWith("userId", "user_1");
    // Both conditions are combined with AND
    expect(andArgs.length).toBe(2);
  });

  it("getProjectById returns null when project belongs to different user", async () => {
    mockThen.mockImplementation((cb: (rows: unknown[]) => unknown) =>
      Promise.resolve(cb([])),
    );

    const result = await getProjectById("proj_1", "wrong_user");

    expect(result).toBeNull();
  });

  it("createProject passes userId when inserting", async () => {
    mockThen.mockResolvedValue({ id: "proj_new", userId: "user_1" });

    await createProject("user_1", "My Project", "Description");

    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith({
      userId: "user_1",
      name: "My Project",
      description: "Description",
    });
  });

  it("updateProject scopes to userId so users cannot update others' projects", async () => {
    const mockUpdateWhere = jest
      .fn()
      .mockReturnValue({ returning: mockReturning });
    mockSet.mockReturnValue({ where: mockUpdateWhere });
    mockThen.mockImplementation((cb: (rows: unknown[]) => unknown) =>
      Promise.resolve(cb([{ id: "proj_1" }])),
    );

    await updateProject("proj_1", "user_1", { name: "New Name" });

    expect(mockUpdate).toHaveBeenCalled();
    expect(and).toHaveBeenCalled();
    const andCall = (and as jest.Mock).mock.calls.find(
      (call: unknown[]) => call.length === 2,
    );
    expect(andCall).toBeDefined();
  });

  it("deleteProject scopes to userId so users cannot delete others' projects", async () => {
    mockThen.mockImplementation((cb: (rows: unknown[]) => unknown) =>
      Promise.resolve(cb([{ id: "proj_1" }])),
    );

    await deleteProject("proj_1", "user_1");

    expect(mockDelete).toHaveBeenCalled();
    expect(and).toHaveBeenCalled();
  });
});
