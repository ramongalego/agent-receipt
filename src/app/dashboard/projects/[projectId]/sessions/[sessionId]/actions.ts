"use server";

import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getUserTeam, assertOwner } from "@/lib/access";
import { getPayload } from "@/lib/r2";
import {
  updateSessionSummary,
  generateShareToken as generateShareTokenQuery,
  revokeShareToken as revokeShareTokenQuery,
} from "@/db/queries/sessions";
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

type SummaryEvent = {
  id: string;
  type: string;
  name: string;
  durationMs: number | null;
  metadata?: Record<string, unknown> | null;
};

const PAYLOAD_CHAR_LIMIT = 500;

function truncate(value: unknown): string {
  const str = JSON.stringify(value, null, 2);
  if (str.length <= PAYLOAD_CHAR_LIMIT) return str;
  return str.slice(0, PAYLOAD_CHAR_LIMIT) + "... (truncated)";
}

export async function generateSessionSummary(
  sessionId: string,
  sessionName: string | null,
  events: SummaryEvent[],
) {
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

  const filtered = (events ?? []).filter((e) => e.name !== "session.end");

  if (filtered.length === 0) {
    return { error: "No events provided.", code: "NO_EVENTS" };
  }

  // Fetch payloads from R2 for all events in parallel
  const payloads = await Promise.all(
    filtered.map(async (e) => {
      const result = await getPayload(e.id);
      if (!result.ok) return null;
      return result.value as { input?: unknown; output?: unknown } | null;
    }),
  );

  const eventLines = filtered
    .map((e, i) => {
      const lines = [`${i + 1}. ${e.name} (${e.type})`];
      if (e.durationMs && e.durationMs > 0) {
        lines.push(`   Duration: ${e.durationMs}ms`);
      }
      if (e.metadata && Object.keys(e.metadata).length > 0) {
        lines.push(`   Metadata: ${JSON.stringify(e.metadata)}`);
      }
      const payload = payloads[i];
      if (payload) {
        if (payload.input != null) {
          lines.push(`   Input: ${truncate(payload.input)}`);
        }
        if (payload.output != null) {
          lines.push(`   Output: ${truncate(payload.output)}`);
        }
      }
      return lines.join("\n");
    })
    .join("\n\n");

  const taskContext = sessionName
    ? `The task was: "${sessionName}".`
    : "The session name was not provided.";

  const prompt = `You are writing a short summary of what an AI agent accomplished during one run. ${taskContext}

Here is the sequence of actions the agent took, including what it received and produced:

${eventLines}

Write 3-5 sentences describing what the agent accomplished. Focus on the outcome, not the technical steps. Do not say things like "made a call to", "invoked a model", "used an API", or "called a function". Instead describe what actually happened in plain language, as if telling a non-technical stakeholder what got done. Short sentences. No jargon. No em dashes. No headings or titles. Just the sentences.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[summary] Anthropic API error:", response.status, body);
      const summary = generateFallbackSummary(sessionName, filtered);
      await updateSessionSummary(sessionId, summary);
      return { summary };
    }

    const data = await response.json();
    const summary =
      data.content?.[0]?.text ?? generateFallbackSummary(sessionName, filtered);

    await updateSessionSummary(sessionId, summary);
    return { summary };
  } catch (e) {
    console.error("[summary] Failed to generate summary:", e);
    const summary = generateFallbackSummary(sessionName, filtered);
    await updateSessionSummary(sessionId, summary);
    return { summary };
  }
}

function generateFallbackSummary(
  sessionName: string | null,
  events: SummaryEvent[],
): string {
  const names = events.filter((e) => e.type !== "error").map((e) => e.name);

  if (sessionName && names.length > 0) {
    return `${sessionName}. The agent performed the following actions: ${names.join(", ")}.`;
  }

  if (names.length > 0) {
    return `The agent performed ${names.length} action${names.length > 1 ? "s" : ""}: ${names.join(", ")}.`;
  }

  return "No actions were recorded in this session.";
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
