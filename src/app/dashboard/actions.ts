"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  createProject,
  updateProject,
  deleteProject,
} from "@/db/queries/projects";
import { createApiKey, revokeApiKey } from "@/db/queries/api-keys";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/lib/validations/project";

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

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const project = await createProject(
    session.user.id,
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

  const parsed = updateProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const updated = await updateProject(session.user.id, projectId, {
    name: parsed.data.name,
    description: parsed.data.description || undefined,
  });

  if (!updated) {
    return { error: "Project not found." };
  }

  redirect(`/dashboard/projects/${projectId}`);
}

export async function deleteProjectAction(
  projectId: string,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const deleted = await deleteProject(projectId, session.user.id);
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

  const revoked = await revokeApiKey(keyId, projectId);
  if (!revoked) {
    return { error: "API key not found." };
  }

  return {};
}
