"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events, agentSessions } from "@/db/schema";
import { getPayload } from "@/lib/r2";

export async function fetchPublicEventPayload(
  eventId: string,
  shareToken: string,
) {
  // Verify the event belongs to a session with this share token
  const row = await db
    .select({ id: events.id })
    .from(events)
    .innerJoin(agentSessions, eq(agentSessions.id, events.sessionId))
    .where(eq(agentSessions.shareToken, shareToken))
    .then((rows) => rows.find((r) => r.id === eventId) ?? null);

  if (!row) {
    return { error: "Event not found.", code: "NOT_FOUND" };
  }

  const result = await getPayload(eventId);

  if (!result.ok) {
    return { error: result.error, code: result.code };
  }

  return { data: result.value };
}
