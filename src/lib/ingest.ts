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
  // Upsert session
  const existingSession = await db
    .select({ id: agentSessions.id })
    .from(agentSessions)
    .where(
      and(
        eq(agentSessions.id, input.sessionId),
        eq(agentSessions.projectId, projectId),
      ),
    )
    .limit(1);

  if (existingSession.length === 0) {
    await db.insert(agentSessions).values({
      id: input.sessionId,
      projectId,
      name: input.sessionName,
      status: "running",
    });
    console.log("[ingest] Session upserted (new)", {
      sessionId: input.sessionId,
    });
  } else {
    console.log("[ingest] Session upserted (existing)", {
      sessionId: input.sessionId,
    });
  }

  // Get previous event hash for chain
  const previousEvents = await db
    .select({ hash: events.hash })
    .from(events)
    .where(eq(events.sessionId, input.sessionId))
    .orderBy(desc(events.timestamp))
    .limit(1);

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

  // Insert event row (without raw payloads)
  const [insertedEvent] = await db
    .insert(events)
    .values({
      sessionId: input.sessionId,
      type: input.event.type,
      name: input.event.name,
      metadata: input.event.metadata ?? null,
      durationMs: input.event.durationMs,
      hash,
      previousHash,
      compliance: input.event.compliance ?? null,
    })
    .returning({ id: events.id });

  console.log("[ingest] Event inserted", { eventId: insertedEvent.id });

  // Store raw payloads in R2 (skip for human_review events which have no payload)
  if (input.event.type !== "human_review") {
    console.log("[ingest] Uploading payload to R2...");
    const r2Result = await putPayload(insertedEvent.id, {
      input: input.event.input,
      output: input.event.output,
    });

    if (!r2Result.ok) {
      console.error("[ingest] R2 upload failed", {
        eventId: insertedEvent.id,
        error: r2Result.error,
      });
      return err(
        `Failed to store event payload in R2: ${r2Result.error}`,
        "R2_UPLOAD_ERROR",
      );
    }

    console.log("[ingest] R2 upload done", { eventId: insertedEvent.id });
  } else {
    console.log("[ingest] Skipping R2 upload for human_review event", {
      eventId: insertedEvent.id,
    });
  }

  // Update API key last used
  await updateApiKeyLastUsed(keyId);

  return ok({ eventId: insertedEvent.id, sessionId: input.sessionId });
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
    .orderBy(desc(events.timestamp))
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
