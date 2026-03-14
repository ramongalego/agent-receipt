import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ingestEventSchema } from "@/lib/validations/ingest";
import {
  validateApiKey,
  processIngestEvent,
  insertSystemErrorEvent,
} from "@/lib/ingest";
import { checkR2Config } from "@/lib/r2";
import { isOverLimit, MAX_EVENTS_PER_SESSION } from "@/lib/billing";
import { getEventCountBySessionId } from "@/db/queries/events";
import { db } from "@/db";
import { projects } from "@/db/schema";

export async function POST(request: NextRequest) {
  // R2 is required for payload storage
  const r2Check = checkR2Config();
  if (!r2Check.ok) {
    return NextResponse.json(
      {
        error: `Ingest endpoint is unavailable. Missing R2 configuration: ${r2Check.missing.join(", ")}. Set these environment variables and restart.`,
        code: "R2_NOT_CONFIGURED",
      },
      { status: 500 },
    );
  }

  // Extract API key from Authorization header
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        error: "Missing or invalid Authorization header.",
        code: "UNAUTHORIZED",
      },
      { status: 401 },
    );
  }

  const apiKey = authHeader.slice(7);
  console.log("[ingest] Validating API key...");
  const keyResult = await validateApiKey(apiKey);

  if (!keyResult.ok) {
    return NextResponse.json(
      { error: keyResult.error, code: keyResult.code },
      { status: 401 },
    );
  }

  console.log("[ingest] API key validated", {
    projectId: keyResult.value.projectId,
  });

  // Check usage limits
  const project = await db
    .select({ userId: projects.userId })
    .from(projects)
    .where(eq(projects.id, keyResult.value.projectId))
    .limit(1)
    .then((rows) => rows[0]);

  if (project && (await isOverLimit(project.userId))) {
    return NextResponse.json(
      {
        error: "Monthly session limit reached. Upgrade your plan.",
        code: "LIMIT_REACHED",
      },
      { status: 429 },
    );
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON.", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  console.log("[ingest] Body parsed");
  const parsed = ingestEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body.",
        code: "VALIDATION_ERROR",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  // Check session event limit
  const eventCount = await getEventCountBySessionId(parsed.data.sessionId);
  if (eventCount >= MAX_EVENTS_PER_SESSION) {
    await insertSystemErrorEvent(
      parsed.data.sessionId,
      "session.limit_reached",
      `Session event limit reached (${MAX_EVENTS_PER_SESSION}). No further events will be accepted. Start a new session to continue.`,
    );

    return NextResponse.json(
      {
        error: "Session event limit reached (200). Start a new session.",
        code: "SESSION_EVENT_LIMIT",
      },
      { status: 429 },
    );
  }

  console.log("[ingest] Validation passed", {
    sessionId: parsed.data.sessionId,
    eventType: parsed.data.event.type,
    eventName: parsed.data.event.name,
  });

  // Process the event
  const result = await processIngestEvent(
    keyResult.value.projectId,
    keyResult.value.keyId,
    parsed.data,
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: result.value }, { status: 201 });
}
