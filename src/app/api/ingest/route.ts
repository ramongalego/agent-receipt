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
import { getSessionProjectId } from "@/db/queries/sessions";
import { checkRateLimit, ingestRateLimit } from "@/lib/rate-limit";
import { db } from "@/db";
import { projects, teams } from "@/db/schema";

const MAX_PAYLOAD_BYTES = 512 * 1024;

export async function POST(request: NextRequest) {
  // Reject oversized payloads before parsing
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const size = Number.parseInt(contentLength, 10);
    if (Number.isFinite(size) && size > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        {
          error: "Payload too large. Maximum size is 512KB.",
          code: "PAYLOAD_TOO_LARGE",
        },
        { status: 413 },
      );
    }
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
  const keyResult = await validateApiKey(apiKey);

  if (!keyResult.ok) {
    return NextResponse.json(
      { error: keyResult.error, code: keyResult.code },
      { status: 401 },
    );
  }

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

  // Parse and validate body
  // content-length is optional (chunked bodies), so check the real size too.
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      {
        error: "Payload too large. Maximum size is 512KB.",
        code: "PAYLOAD_TOO_LARGE",
      },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON.", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

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

  // A session ID is owned by the project that created it. Another project's
  // key must not be able to append to (or probe) that session's chain.
  const sessionProjectId = await getSessionProjectId(parsed.data.sessionId);
  if (sessionProjectId && sessionProjectId !== keyResult.value.projectId) {
    return NextResponse.json(
      {
        error:
          "This session ID is already used by another project. Generate a new session ID.",
        code: "SESSION_CONFLICT",
      },
      { status: 409 },
    );
  }
  const isNewSession = sessionProjectId === null;

  // The monthly limit counts sessions, so it only stops new ones. Events for
  // a session that's already running are still accepted.
  if (isNewSession) {
    // Check usage limits, find the team owner for billing
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
  }

  // Check session event limit
  const eventCount = isNewSession
    ? 0
    : await getEventCountBySessionId(parsed.data.sessionId);
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
