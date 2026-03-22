import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getUserTeam } from "@/lib/access";
import { anchorSessionIfEligible } from "@/lib/anchor-session";
import { db } from "@/db";
import { agentSessions, projects } from "@/db/schema";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Not authenticated.", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON.", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const { sessionId } = body as { sessionId?: string };
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json(
      { error: "sessionId is required.", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const team = await getUserTeam(session.user.id);

  // Verify the session belongs to the caller's team
  const agentSession = await db
    .select({
      id: agentSessions.id,
      projectId: agentSessions.projectId,
    })
    .from(agentSessions)
    .innerJoin(projects, eq(projects.id, agentSessions.projectId))
    .where(and(eq(agentSessions.id, sessionId), eq(projects.teamId, team.id)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!agentSession) {
    return NextResponse.json(
      {
        error: "Session not found or you do not have access.",
        code: "FORBIDDEN",
      },
      { status: 403 },
    );
  }

  await anchorSessionIfEligible(sessionId, agentSession.projectId, team.id);

  return NextResponse.json({ success: true });
}
