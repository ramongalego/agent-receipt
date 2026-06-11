"use server";

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { events, agentSessions } from "@/db/schema";
import { getPayload } from "@/lib/r2";

export async function fetchPublicEventPayload(
  eventId: string,
  shareToken: string,
) {
  // Verify the event belongs to a session with this share token
  const row = await db
    .select({ id: events.id, compliance: events.compliance })
    .from(events)
    .innerJoin(agentSessions, eq(agentSessions.id, events.sessionId))
    .where(
      and(eq(events.id, eventId), eq(agentSessions.shareToken, shareToken)),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!row) {
    return { error: "Event not found.", code: "NOT_FOUND" };
  }

  if (row.compliance?.containsPII || row.compliance?.dataCategory) {
    return {
      error:
        "This event contains sensitive data and is not available in shared receipts.",
      code: "PII_REDACTED",
    };
  }

  const result = await getPayload(eventId);

  if (!result.ok) {
    return { error: result.error, code: result.code };
  }

  return { data: result.value };
}
