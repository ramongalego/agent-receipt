import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { projects, apiKeys, agentSessions } from "@/db/schema";

export function getProjectsByUser(userId: string) {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
      sessionCount: sql<number>`cast(count(distinct ${agentSessions.id}) as int)`,
      hasApiKey: sql<boolean>`bool_or(${apiKeys.id} is not null and ${apiKeys.revoked} = false)`,
    })
    .from(projects)
    .leftJoin(agentSessions, eq(agentSessions.projectId, projects.id))
    .leftJoin(
      apiKeys,
      and(eq(apiKeys.projectId, projects.id), eq(apiKeys.revoked, false)),
    )
    .where(eq(projects.userId, userId))
    .groupBy(projects.id)
    .orderBy(projects.createdAt);
}

export function getProjectById(projectId: string, userId: string) {
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

export function createProject(
  userId: string,
  name: string,
  description?: string,
) {
  return db
    .insert(projects)
    .values({ userId, name, description })
    .returning()
    .then((rows) => rows[0]);
}

export function updateProject(
  projectId: string,
  userId: string,
  data: { name?: string; description?: string },
) {
  return db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning()
    .then((rows) => rows[0] ?? null);
}

export function deleteProject(projectId: string, userId: string) {
  return db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning()
    .then((rows) => rows[0] ?? null);
}
