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
import { checkRateLimit, ingestRateLimit } from "@/lib/rate-limit";
import { db } from "@/db";
import { projects, teams } from "@/db/schema";

export async function POST(request: NextRequest) {
  // Reject oversized payloads before parsing
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 512 * 1024) {
    return NextResponse.json(
      {
        error: "Payload too large. Maximum size is 512KB.",
        code: "PAYLOAD_TOO_LARGE",
      },
      { status: 413 },
    );
  }

  // R2 is required for payload storage
  const r2Check = checkR2Config();
  if (!r2Check.ok) {
    return NextResponse.json(
      {
        error: "Ingest endpoint is temporarily unavailable.",
        code: "SERVICE_UNAVAILABLE",
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
  console.debug("[ingest] Validating API key...");
  const keyResult = await validateApiKey(apiKey);

  if (!keyResult.ok) {
    return NextResponse.json(
      { error: keyResult.error, code: keyResult.code },
      { status: 401 },
    );
  }

  console.debug("[ingest] API key validated", {
    projectId: keyResult.value.projectId,
  });

  // Rate limit per API key
  const rl = await checkRateLimit(ingestRateLimit, keyResult.value.projectId);
  if (!rl.success) {
    return NextResponse.json(
      {
        error: "Too many requests. Try again later.",
        code: "RATE_LIMITED",
      },
      { status: 429 },
    );
  }

  // Check usage limits — find the team owner for billing
  const projectRow = await db
    .select({ ownerId: teams.ownerId })
    .from(projects)
    .innerJoin(teams, eq(teams.id, projects.teamId))
    .where(eq(projects.id, keyResult.value.projectId))
    .limit(1)
    .then((rows) => rows[0]);

  if (projectRow && (await isOverLimit(projectRow.ownerId))) {
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

  console.debug("[ingest] Body parsed");
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

  console.debug("[ingest] Validation passed");

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
