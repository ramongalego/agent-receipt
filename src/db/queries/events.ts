import { eq, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";

export function getEventsBySessionId(sessionId: string) {
  return db
    .select()
    .from(events)
    .where(eq(events.sessionId, sessionId))
    .orderBy(asc(events.timestamp));
}

export async function getEventCountBySessionId(
  sessionId: string,
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`cast(count(${events.id}) as int)` })
    .from(events)
    .where(eq(events.sessionId, sessionId));

  return result[0]?.count ?? 0;
}
