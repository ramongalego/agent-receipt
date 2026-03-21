import { cache } from "react";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { teams, teamMembers } from "@/db/schema";

export type TeamRole = "owner" | "viewer";

export type Team = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
};

export async function getUserTeam(userId: string): Promise<Team> {
  const membership = await db
    .select({
      id: teams.id,
      name: teams.name,
      ownerId: teams.ownerId,
      createdAt: teams.createdAt,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, userId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!membership) {
    throw new Error("User does not belong to any team.");
  }

  return membership;
}

export const getUserTeamCached = cache((userId: string) => getUserTeam(userId));

export async function assertTeamMember(
  userId: string,
  teamId: string,
): Promise<void> {
  const row = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!row) {
    throw new Error("You are not a member of this team.");
  }
}

export async function assertOwner(
  userId: string,
  teamId: string,
): Promise<void> {
  const row = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!row || row.role !== "owner") {
    throw new Error("You must be an owner to perform this action.");
  }
}

export async function getUserRole(
  userId: string,
  teamId: string,
): Promise<TeamRole> {
  const row = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!row) {
    throw new Error("User is not a member of this team.");
  }

  return row.role as TeamRole;
}
