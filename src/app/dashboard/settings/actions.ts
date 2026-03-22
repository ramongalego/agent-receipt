"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { getUserTeam, assertOwner, getUserRole } from "@/lib/access";
import {
  createInvite,
  removeTeamMember,
  updateMemberRole,
  revokeInvite,
  isEmailAlreadyMember,
  hasPendingInvite,
} from "@/db/queries/invites";
import { sendInviteEmail } from "@/lib/invite-email";
import { checkRateLimit, inviteRateLimit } from "@/lib/rate-limit";

type ActionResult = {
  error?: string;
  success?: boolean;
};

export async function updateWorkspaceNameAction(
  name: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const team = await getUserTeam(session.user.id);

  try {
    await assertOwner(session.user.id, team.id);
  } catch {
    return { error: "Only workspace owners can rename the workspace." };
  }

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 100) {
    return { error: "Workspace name must be between 1 and 100 characters." };
  }

  await db.update(teams).set({ name: trimmed }).where(eq(teams.id, team.id));

  return { success: true };
}

export async function sendInviteAction(
  email: string,
  role: "owner" | "viewer",
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const team = await getUserTeam(session.user.id);

  try {
    await assertOwner(session.user.id, team.id);
  } catch {
    return { error: "Only workspace owners can send invites." };
  }

  const rl = await checkRateLimit(inviteRateLimit, team.id);
  if (!rl.success) {
    return { error: "Too many invites. Try again later." };
  }

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  if (await isEmailAlreadyMember(team.id, trimmedEmail)) {
    return { error: "This person is already in your workspace." };
  }

  if (await hasPendingInvite(team.id, trimmedEmail)) {
    return { error: "An invite is already pending for this email." };
  }

  const { token } = await createInvite(
    team.id,
    trimmedEmail,
    role,
    session.user.id,
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  console.log(
    `[invite] Invite link for ${trimmedEmail}: ${appUrl}/invite/${token}`,
  );

  try {
    await sendInviteEmail(trimmedEmail, team.name, token);
  } catch (e) {
    console.error("[invite] Failed to send invite email:", e);
  }

  return { success: true };
}

export async function removeMemberAction(
  userId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const team = await getUserTeam(session.user.id);

  try {
    await assertOwner(session.user.id, team.id);
  } catch {
    return { error: "Only workspace owners can remove members." };
  }

  if (userId === session.user.id) {
    return { error: "You cannot remove yourself from the workspace." };
  }

  const removed = await removeTeamMember(userId, team.id);
  if (!removed) {
    return { error: "Member not found." };
  }

  return { success: true };
}

export async function changeMemberRoleAction(
  userId: string,
  role: "owner" | "viewer",
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const team = await getUserTeam(session.user.id);

  try {
    await assertOwner(session.user.id, team.id);
  } catch {
    return { error: "Only workspace owners can change roles." };
  }

  if (userId === session.user.id) {
    return { error: "You cannot change your own role." };
  }

  const updated = await updateMemberRole(userId, team.id, role);
  if (!updated) {
    return { error: "Member not found." };
  }

  return { success: true };
}

export async function revokeInviteAction(
  inviteId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const team = await getUserTeam(session.user.id);

  try {
    await assertOwner(session.user.id, team.id);
  } catch {
    return { error: "Only workspace owners can revoke invites." };
  }

  const revoked = await revokeInvite(inviteId, team.id);
  if (!revoked) {
    return { error: "Invite not found." };
  }

  return { success: true };
}

export async function getWorkspaceData() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const team = await getUserTeam(session.user.id);
  const role = await getUserRole(session.user.id, team.id);

  return { team, role, userId: session.user.id };
}
