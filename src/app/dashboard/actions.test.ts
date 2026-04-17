/**
 * @jest-environment node
 */

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/access", () => ({
  getUserTeam: jest.fn(),
  assertOwner: jest.fn(),
}));

jest.mock("@/db/queries/projects", () => ({
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
}));

jest.mock("@/db/queries/api-keys", () => ({
  createApiKey: jest.fn(),
  revokeApiKey: jest.fn(),
}));

jest.mock("@/lib/validations/project", () => ({
  createProjectSchema: {
    safeParse: jest.fn().mockReturnValue({
      success: true,
      data: { name: "Test", description: undefined },
    }),
  },
  updateProjectSchema: {
    safeParse: jest.fn().mockReturnValue({
      success: true,
      data: { name: "Updated", description: undefined },
    }),
  },
  createApiKeySchema: {
    safeParse: jest.fn((input: { name: string }) => ({
      success: true,
      data: { name: input.name },
    })),
  },
}));

const mockRedirect = jest.fn().mockImplementation(() => {
  throw new Error("NEXT_REDIRECT");
});

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

import { getUserTeam, assertOwner } from "@/lib/access";
import { deleteProject } from "@/db/queries/projects";
import {
  createProjectAction,
  deleteProjectAction,
  createApiKeyAction,
} from "./actions";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { auth: mockAuth } = require("@/lib/auth") as {
  auth: jest.Mock;
};

const mockGetUserTeam = getUserTeam as jest.MockedFunction<typeof getUserTeam>;
const mockAssertOwner = assertOwner as jest.MockedFunction<typeof assertOwner>;
const mockDeleteProject = deleteProject as jest.MockedFunction<
  typeof deleteProject
>;

describe("dashboard actions access control", () => {
  const ownerSession = {
    user: { id: "user-owner", email: "owner@test.com" },
    expires: "2030-01-01",
  };

  const viewerSession = {
    user: { id: "user-viewer", email: "viewer@test.com" },
    expires: "2030-01-01",
  };

  const team = {
    id: "team-1",
    name: "Test Team",
    ownerId: "user-owner",
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserTeam.mockResolvedValue(team);
  });

  describe("viewer attempting a mutation", () => {
    it("returns an error when a viewer tries to delete a project", async () => {
      mockAuth.mockResolvedValue(viewerSession);
      mockAssertOwner.mockRejectedValue(
        new Error("You must be an owner to perform this action."),
      );

      const result = await deleteProjectAction("proj-1");

      expect(result.error).toBe("Only workspace owners can delete projects.");
      expect(mockDeleteProject).not.toHaveBeenCalled();
    });

    it("returns an error when a viewer tries to create a project", async () => {
      mockAuth.mockResolvedValue(viewerSession);
      mockAssertOwner.mockRejectedValue(
        new Error("You must be an owner to perform this action."),
      );

      const formData = new FormData();
      formData.set("name", "New Project");

      const result = await createProjectAction({}, formData);

      expect(result.error).toBe("Only workspace owners can create projects.");
    });

    it("returns an error when a viewer tries to create an API key", async () => {
      mockAuth.mockResolvedValue(viewerSession);
      mockAssertOwner.mockRejectedValue(
        new Error("You must be an owner to perform this action."),
      );

      const result = await createApiKeyAction("proj-1", "My Key");

      expect(result.error).toBe("Only workspace owners can create API keys.");
    });
  });

  describe("owner can perform mutations", () => {
    it("allows an owner to delete a project", async () => {
      mockAuth.mockResolvedValue(ownerSession);
      mockAssertOwner.mockResolvedValue(undefined);
      mockDeleteProject.mockResolvedValue({
        id: "proj-1",
        teamId: "team-1",
        name: "Test",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // deleteProjectAction calls redirect on success, which throws
      await expect(deleteProjectAction("proj-1")).rejects.toThrow(
        "NEXT_REDIRECT",
      );

      expect(mockDeleteProject).toHaveBeenCalledWith("proj-1", "team-1");
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });
  });
});
