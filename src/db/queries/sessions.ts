import { eq, and, desc, asc, sql, count } from "drizzle-orm";
import { db } from "@/db";
import { agentSessions, events } from "@/db/schema";

export async function getSessionsByProject(
  projectId: string,
  page: number,
  limit: number,
) {
  const offset = (page - 1) * limit;

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: agentSessions.id,
        name: agentSessions.name,
        status: agentSessions.status,
        startedAt: agentSessions.startedAt,
        completedAt: agentSessions.completedAt,
        eventCount: sql<number>`cast(count(${events.id}) as int)`,
        lastEventAt: sql<Date | null>`max(${events.timestamp})`,
        hasError: sql<boolean>`bool_or(${events.type} = 'error')`,
        hasLimitReached: sql<boolean>`bool_or(${events.name} = 'session.limit_reached')`,
      })
      .from(agentSessions)
      .leftJoin(events, eq(events.sessionId, agentSessions.id))
      .where(eq(agentSessions.projectId, projectId))
      .groupBy(agentSessions.id)
      .orderBy(desc(agentSessions.startedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(agentSessions)
      .where(eq(agentSessions.projectId, projectId))
      .then((r) => r[0]?.total ?? 0),
  ]);

  return { rows, total: totalRows };
}

export function getSessionById(sessionId: string, projectId: string) {
  return db
    .select()
    .from(agentSessions)
    .where(
      and(
        eq(agentSessions.id, sessionId),
        eq(agentSessions.projectId, projectId),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

export function getEventsBySession(sessionId: string) {
  return db
    .select({
      id: events.id,
      type: events.type,
      name: events.name,
      durationMs: events.durationMs,
      metadata: events.metadata,
      hash: events.hash,
      previousHash: events.previousHash,
      compliance: events.compliance,
      timestamp: events.timestamp,
    })
    .from(events)
    .where(eq(events.sessionId, sessionId))
    .orderBy(asc(events.timestamp));
}

export function updateSessionSummary(sessionId: string, summary: string) {
  return db
    .update(agentSessions)
    .set({ summary })
    .where(eq(agentSessions.id, sessionId));
}
