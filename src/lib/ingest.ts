import { randomUUID } from "crypto";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, agentSessions, events } from "@/db/schema";
import { hashApiKey } from "./api-key";
import { hashEvent } from "./hash";
import { putPayload } from "./r2";
import { updateApiKeyLastUsed } from "@/db/queries/api-keys";
import { ok, err, type Result } from "./result";
import type { IngestEventInput } from "./validations/ingest";

type IngestResult = {
  eventId: string;
  sessionId: string;
};

export async function validateApiKey(
  bearerToken: string,
): Promise<Result<{ projectId: string; keyId: string }>> {
  // Note: SQL string comparison is not constant-time, but the key is SHA-256 hashed
  // before comparison. Exploiting timing differences would require reversing the hash.
  // Accepted risk — not fixing to avoid fetching all keys into memory.
  const keyHash = hashApiKey(bearerToken);

  const rows = await db
    .select({ id: apiKeys.id, projectId: apiKeys.projectId })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.revoked, false)))
    .limit(1);

  if (rows.length === 0) {
    return err("Invalid or revoked API key.", "INVALID_API_KEY");
  }

  return ok({ projectId: rows[0].projectId, keyId: rows[0].id });
}

export async function processIngestEvent(
  projectId: string,
  keyId: string,
  input: IngestEventInput,
): Promise<Result<IngestResult>> {
  // Upsert session and get previous hash in parallel.
  // Order by timestamp desc then id desc — the id tiebreaker ensures a
  // deterministic pick when two events share the same millisecond.
  const [existingSession, previousEvents] = await Promise.all([
    db
      .select({ id: agentSessions.id })
      .from(agentSessions)
      .where(
        and(
          eq(agentSessions.id, input.sessionId),
          eq(agentSessions.projectId, projectId),
        ),
      )
      .limit(1),
    db
      .select({ hash: events.hash })
      .from(events)
      .where(eq(events.sessionId, input.sessionId))
      .orderBy(desc(events.timestamp), desc(events.id))
      .limit(1),
  ]);

  if (existingSession.length === 0) {
    await db.insert(agentSessions).values({
      id: input.sessionId,
      projectId,
      name: input.sessionName,
      status: "running",
      context: input.sessionContext ?? null,
    });
  } else if (input.sessionContext) {
    // Update context if provided on a subsequent event (first one wins for safety,
    // but allow setting it if it was not set on session creation)
    await db
      .update(agentSessions)
      .set({ context: input.sessionContext })
      .where(eq(agentSessions.id, input.sessionId));
  }

  const previousHash =
    previousEvents.length > 0 ? previousEvents[0].hash : null;

  // Compute hash
  const eventData = {
    type: input.event.type,
    name: input.event.name,
    durationMs: input.event.durationMs,
    metadata: input.event.metadata,
  };
  const hash = hashEvent(eventData, previousHash);

  // Pre-generate the event id so we can upload the payload to R2 before
  // committing the row. If R2 fails we never insert — no orphaned rows with
  // no payload, which would otherwise break the hash chain's audit promise
  // and cause SDK retries to create duplicates.
  const eventId = randomUUID();

  // Store raw payloads in R2 first (skip for human_review events which have no payload)
  if (input.event.type !== "human_review") {
    const r2Payload: { input: unknown; output: unknown; context?: unknown } = {
      input: input.event.input,
      output: input.event.output,
    };
    if (input.event.context) {
      r2Payload.context = input.event.context;
    }
    const r2Result = await putPayload(eventId, r2Payload);

    if (!r2Result.ok) {
      console.error("[ingest] R2 upload failed", {
        eventId,
        error: r2Result.error,
      });
      return err(
        `Failed to store event payload in R2: ${r2Result.error}`,
        "R2_UPLOAD_ERROR",
      );
    }
  }

  // Insert event row (without raw payloads)
  await db.insert(events).values({
    id: eventId,
    sessionId: input.sessionId,
    type: input.event.type,
    name: input.event.name,
    metadata: input.event.metadata ?? null,
    durationMs: input.event.durationMs,
    hash,
    previousHash,
    compliance: input.event.compliance ?? null,
  });

  // Mark session as explicitly completed when session.end event is received
  if (input.event.name === "session.end") {
    await db
      .update(agentSessions)
      .set({ explicitlyCompletedAt: new Date() })
      .where(eq(agentSessions.id, input.sessionId));
  }

  // Update API key last used (fire-and-forget, non-critical)
  void updateApiKeyLastUsed(keyId);

  return ok({ eventId, sessionId: input.sessionId });
}

export async function insertSystemErrorEvent(
  sessionId: string,
  name: string,
  message: string,
): Promise<void> {
  const previousEvents = await db
    .select({ hash: events.hash, name: events.name })
    .from(events)
    .where(eq(events.sessionId, sessionId))
    .orderBy(desc(events.timestamp), desc(events.id))
    .limit(1);

  if (previousEvents.length > 0 && previousEvents[0].name === name) {
    return;
  }

  const previousHash =
    previousEvents.length > 0 ? previousEvents[0].hash : null;

  const eventData = {
    type: "error" as const,
    name,
    durationMs: 0,
    metadata: { message },
  };
  const hash = hashEvent(eventData, previousHash);

  await db.insert(events).values({
    sessionId,
    type: "error",
    name,
    metadata: { message },
    durationMs: 0,
    hash,
    previousHash,
  });
}
