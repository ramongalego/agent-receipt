"use server";

import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getUserTeam, assertOwner } from "@/lib/access";
import { getPayload } from "@/lib/r2";
import {
  generateShareToken as generateShareTokenQuery,
  revokeShareToken as revokeShareTokenQuery,
} from "@/db/queries/sessions";
import { generateAndStoreSummary } from "@/lib/summary";
import { anchorSessionIfEligible } from "@/lib/anchor-session";
import { db } from "@/db";
import { events, agentSessions, projects } from "@/db/schema";

async function verifyEventAccess(
  eventId: string,
  teamId: string,
): Promise<boolean> {
  const row = await db
    .select({ id: events.id })
    .from(events)
    .innerJoin(agentSessions, eq(agentSessions.id, events.sessionId))
    .innerJoin(projects, eq(projects.id, agentSessions.projectId))
    .where(and(eq(events.id, eventId), eq(projects.teamId, teamId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  return row !== null;
}

async function verifySessionAccess(
  sessionId: string,
  teamId: string,
): Promise<boolean> {
  const row = await db
    .select({ id: agentSessions.id })
    .from(agentSessions)
    .innerJoin(projects, eq(projects.id, agentSessions.projectId))
    .where(and(eq(agentSessions.id, sessionId), eq(projects.teamId, teamId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  return row !== null;
}

export async function fetchEventPayload(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated.", code: "UNAUTHORIZED" };
  }

  const team = await getUserTeam(session.user.id);
  const hasAccess = await verifyEventAccess(eventId, team.id);
  if (!hasAccess) {
    return {
      error: "You do not have access to this event.",
      code: "FORBIDDEN",
    };
  }

  const result = await getPayload(eventId);

  if (!result.ok) {
    return { error: result.error, code: result.code };
  }

  return { data: result.value };
}

export async function generateSessionSummary(
  sessionId: string,
): Promise<{ summary: string } | { error: string; code: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated.", code: "UNAUTHORIZED" };
  }

  const team = await getUserTeam(session.user.id);
  const hasAccess = await verifySessionAccess(sessionId, team.id);
  if (!hasAccess) {
    return {
      error: "You do not have access to this session.",
      code: "FORBIDDEN",
    };
  }

  // Events and payloads are fetched server-side from the verified session.
  // Client-supplied event IDs must never reach R2: payloads are tenant data.
  const summary = await generateAndStoreSummary(sessionId);
  return { summary };
}

export async function retryRekorAnchor(
  sessionId: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated." };
  }

  const team = await getUserTeam(session.user.id);

  // Verify the session belongs to this team
  const agentSession = await db
    .select({
      id: agentSessions.id,
      projectId: agentSessions.projectId,
      rekorStatus: agentSessions.rekorStatus,
    })
    .from(agentSessions)
    .innerJoin(projects, eq(projects.id, agentSessions.projectId))
    .where(and(eq(agentSessions.id, sessionId), eq(projects.teamId, team.id)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!agentSession) {
    return { error: "Session not found or you do not have access." };
  }

  if (agentSession.rekorStatus !== "failed") {
    return { error: "Only failed anchors can be retried." };
  }

  // Reset status and re-trigger, awaiting so the page revalidates after
  await db
    .update(agentSessions)
    .set({ rekorStatus: null })
    .where(eq(agentSessions.id, sessionId));

  await anchorSessionIfEligible(sessionId, agentSession.projectId, team.id);

  return {};
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://agentreceipt.co";

export async function generateShareLink(
  sessionId: string,
): Promise<{ token: string; url: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated." };
  }

  const team = await getUserTeam(session.user.id);
  await assertOwner(session.user.id, team.id);

  const token = await generateShareTokenQuery(sessionId, team.id);
  if (!token) {
    return { error: "Session not found or you do not have access." };
  }

  return { token, url: `${appUrl}/s/${token}` };
}

export async function revokeShareLink(
  sessionId: string,
): Promise<{ success: boolean } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated." };
  }

  const team = await getUserTeam(session.user.id);
  await assertOwner(session.user.id, team.id);

  const revoked = await revokeShareTokenQuery(sessionId, team.id);
  if (!revoked) {
    return { error: "Session not found or you do not have access." };
  }

  return { success: true };
}
