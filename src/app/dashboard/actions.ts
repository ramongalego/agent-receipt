"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  createProject,
  updateProject,
  deleteProject,
  getProjectById,
} from "@/db/queries/projects";
import { createApiKey, revokeApiKey } from "@/db/queries/api-keys";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/lib/validations/project";
import { getUserTeam, assertOwner } from "@/lib/access";

type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const team = await getUserTeam(session.user.id);

  try {
    await assertOwner(session.user.id, team.id);
  } catch {
    return { error: "Only workspace owners can create projects." };
  }

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const project = await createProject(
    team.id,
    parsed.data.name,
    parsed.data.description || undefined,
  );

  redirect(`/dashboard/projects/${project.id}`);
}

export async function updateProjectAction(
  projectId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const team = await getUserTeam(session.user.id);

  try {
    await assertOwner(session.user.id, team.id);
  } catch {
    return { error: "Only workspace owners can update projects." };
  }

  const parsed = updateProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const updated = await updateProject(projectId, team.id, {
    name: parsed.data.name,
    description: parsed.data.description || undefined,
  });

  if (!updated) {
    return { error: "Project not found." };
  }

  return {};
}

export async function deleteProjectAction(
  projectId: string,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const team = await getUserTeam(session.user.id);

  try {
    await assertOwner(session.user.id, team.id);
  } catch {
    return { error: "Only workspace owners can delete projects." };
  }

  const deleted = await deleteProject(projectId, team.id);
  if (!deleted) {
    return { error: "Project not found." };
  }

  redirect("/dashboard");
}

export async function createApiKeyAction(
  projectId: string,
  name: string,
): Promise<{ key?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const team = await getUserTeam(session.user.id);

  try {
    await assertOwner(session.user.id, team.id);
  } catch {
    return { error: "Only workspace owners can create API keys." };
  }

  const project = await getProjectById(projectId, team.id);
  if (!project) {
    return { error: "Project not found." };
  }

  const { key } = await createApiKey(projectId, name);
  return { key };
}

export async function revokeApiKeyAction(
  keyId: string,
  projectId: string,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const team = await getUserTeam(session.user.id);

  try {
    await assertOwner(session.user.id, team.id);
  } catch {
    return { error: "Only workspace owners can revoke API keys." };
  }

  const project = await getProjectById(projectId, team.id);
  if (!project) {
    return { error: "Project not found." };
  }

  const revoked = await revokeApiKey(keyId, projectId);
  if (!revoked) {
    return { error: "API key not found." };
  }

  return {};
}
