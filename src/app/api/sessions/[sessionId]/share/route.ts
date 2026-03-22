import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { validateApiKey } from "@/lib/ingest";
import { db } from "@/db";
import { agentSessions, projects } from "@/db/schema";
import { generateShareToken } from "@/db/queries/sessions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

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

  // Verify the session belongs to the project that owns the API key
  const session = await db
    .select({ id: agentSessions.id, teamId: projects.teamId })
    .from(agentSessions)
    .innerJoin(projects, eq(projects.id, agentSessions.projectId))
    .where(
      and(
        eq(agentSessions.id, sessionId),
        eq(agentSessions.projectId, keyResult.value.projectId),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!session) {
    return NextResponse.json(
      {
        error: "Session not found or does not belong to this project.",
        code: "FORBIDDEN",
      },
      { status: 403 },
    );
  }

  const token = await generateShareToken(sessionId, session.teamId);

  if (!token) {
    return NextResponse.json(
      { error: "Failed to generate share token.", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://agentreceipt.co";

  return NextResponse.json({
    data: {
      token,
      url: `${appUrl}/s/${token}`,
    },
  });
}
