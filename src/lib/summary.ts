import { eq } from "drizzle-orm";
import { getPayload } from "@/lib/r2";
import {
  getEventsBySession,
  updateSessionSummary,
} from "@/db/queries/sessions";
import { db } from "@/db";
import { agentSessions } from "@/db/schema";

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

/**
 * Generate a summary for a session and persist it.
 * Can be called from the dashboard (with pre-fetched events) or from
 * the ingest handler (events fetched from DB).
 */
export async function generateAndStoreSummary(
  sessionId: string,
  sessionName?: string | null,
  events?: SummaryEvent[],
): Promise<string> {
  // Fetch session name from DB if not provided
  const name: string | null =
    sessionName ??
    (await db
      .select({ name: agentSessions.name })
      .from(agentSessions)
      .where(eq(agentSessions.id, sessionId))
      .limit(1)
      .then((rows) => rows[0]?.name ?? null));

  const eventList =
    events ??
    (await getEventsBySession(sessionId)).map((e) => ({
      id: e.id,
      type: e.type,
      name: e.name,
      durationMs: e.durationMs,
      metadata: e.metadata as Record<string, unknown> | null,
    }));

  const filtered = eventList.filter((e) => e.name !== "session.end");

  if (filtered.length === 0) {
    const summary = "No actions were recorded in this session.";
    await updateSessionSummary(sessionId, summary);
    return summary;
  }

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

  const taskContext = name
    ? `The task was: "${name}".`
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
      const summary = generateFallbackSummary(name, filtered);
      await updateSessionSummary(sessionId, summary);
      return summary;
    }

    const data = await response.json();
    const summary =
      data.content?.[0]?.text ?? generateFallbackSummary(name, filtered);

    await updateSessionSummary(sessionId, summary);
    return summary;
  } catch (e) {
    console.error("[summary] Failed to generate summary:", e);
    const summary = generateFallbackSummary(name, filtered);
    await updateSessionSummary(sessionId, summary);
    return summary;
  }
}
