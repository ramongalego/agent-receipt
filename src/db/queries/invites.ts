import { eq, and, isNull, sql, inArray } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { inviteTokens, teamMembers, teams, users, projects } from "@/db/schema";

export async function createInvite(
  teamId: string,
  email: string,
  role: "owner" | "viewer",
  invitedBy: string,
) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [invite] = await db
    .insert(inviteTokens)
    .values({ teamId, email, role, token, invitedBy, expiresAt })
    .returning();

  return { invite, token };
}

export async function getInviteByToken(token: string) {
  const invite = await db
    .select({
      id: inviteTokens.id,
      teamId: inviteTokens.teamId,
      email: inviteTokens.email,
      role: inviteTokens.role,
      token: inviteTokens.token,
      invitedBy: inviteTokens.invitedBy,
      acceptedAt: inviteTokens.acceptedAt,
      expiresAt: inviteTokens.expiresAt,
      teamName: teams.name,
    })
    .from(inviteTokens)
    .innerJoin(teams, eq(teams.id, inviteTokens.teamId))
    .where(eq(inviteTokens.token, token))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!invite) return null;
  if (invite.acceptedAt) return null;
  if (invite.expiresAt < new Date()) return null;

  return invite;
}

export async function acceptInvite(token: string, userId: string) {
  const invite = await getInviteByToken(token);
  if (!invite) return null;

  await db
    .update(inviteTokens)
    .set({ acceptedAt: new Date() })
    .where(eq(inviteTokens.token, token));

  const [member] = await db
    .insert(teamMembers)
    .values({
      teamId: invite.teamId,
      userId,
      role: invite.role,
      invitedBy: invite.invitedBy,
    })
    .returning();

  // Clean up auto-created solo team if it has no projects.
  // When a user signs up they get an empty "Main Workspace". If they
  // immediately accept an invite to another team, that empty team is
  // just clutter. Delete it so getUserTeam returns the invited team.
  const soloTeams = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.ownerId, userId), eq(teams.name, "Main Workspace")));

  const candidateIds = soloTeams
    .map((t) => t.id)
    .filter((id) => id !== invite.teamId);

  if (candidateIds.length > 0) {
    const projectCounts = await db
      .select({
        teamId: projects.teamId,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(projects)
      .where(inArray(projects.teamId, candidateIds))
      .groupBy(projects.teamId);

    const countMap = new Map(projectCounts.map((r) => [r.teamId, r.count]));

    for (const id of candidateIds) {
      if ((countMap.get(id) ?? 0) === 0) {
        await db.delete(teamMembers).where(eq(teamMembers.teamId, id));
        await db.delete(teams).where(eq(teams.id, id));
      }
    }
  }

  return member;
}

export async function getTeamMembers(teamId: string) {
  return db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      role: teamMembers.role,
      createdAt: teamMembers.createdAt,
      userName: users.name,
      userEmail: users.email,
      userImage: users.image,
    })
    .from(teamMembers)
    .innerJoin(users, eq(users.id, teamMembers.userId))
    .where(eq(teamMembers.teamId, teamId))
    .orderBy(teamMembers.createdAt);
}

export async function removeTeamMember(userId: string, teamId: string) {
  return db
    .delete(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)))
    .returning()
    .then((rows) => rows[0] ?? null);
}

export async function updateMemberRole(
  userId: string,
  teamId: string,
  role: "owner" | "viewer",
) {
  return db
    .update(teamMembers)
    .set({ role })
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)))
    .returning()
    .then((rows) => rows[0] ?? null);
}

export async function getPendingInvites(teamId: string) {
  return db
    .select({
      id: inviteTokens.id,
      email: inviteTokens.email,
      role: inviteTokens.role,
      expiresAt: inviteTokens.expiresAt,
      token: inviteTokens.token,
    })
    .from(inviteTokens)
    .where(
      and(eq(inviteTokens.teamId, teamId), isNull(inviteTokens.acceptedAt)),
    )
    .orderBy(inviteTokens.expiresAt);
}

export async function revokeInvite(inviteId: string, teamId: string) {
  return db
    .delete(inviteTokens)
    .where(and(eq(inviteTokens.id, inviteId), eq(inviteTokens.teamId, teamId)))
    .returning()
    .then((rows) => rows[0] ?? null);
}

export async function isEmailAlreadyMember(teamId: string, email: string) {
  const row = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .innerJoin(users, eq(users.id, teamMembers.userId))
    .where(and(eq(teamMembers.teamId, teamId), eq(users.email, email)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  return !!row;
}

export async function hasPendingInvite(teamId: string, email: string) {
  const row = await db
    .select({ id: inviteTokens.id })
    .from(inviteTokens)
    .where(
      and(
        eq(inviteTokens.teamId, teamId),
        eq(inviteTokens.email, email),
        isNull(inviteTokens.acceptedAt),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  return !!row;
}
