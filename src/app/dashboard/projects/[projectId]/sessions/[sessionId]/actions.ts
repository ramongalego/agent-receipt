"use server";

import { auth } from "@/lib/auth";
import { getPayload } from "@/lib/r2";
import { updateSessionSummary } from "@/db/queries/sessions";

export async function fetchEventPayload(eventId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Not authenticated.", code: "UNAUTHORIZED" };
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
  if (!session?.user) {
    return { error: "Not authenticated.", code: "UNAUTHORIZED" };
  }

  if (!events || events.length === 0) {
    return { error: "No events provided.", code: "NO_EVENTS" };
  }

  // Fetch payloads from R2 for all events in parallel
  const payloads = await Promise.all(
    events.map(async (e) => {
      const result = await getPayload(e.id);
      if (!result.ok) return null;
      return result.value as { input?: unknown; output?: unknown } | null;
    }),
  );

  const eventLines = events
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
      const summary = generateFallbackSummary(sessionName, events);
      await updateSessionSummary(sessionId, summary);
      return { summary };
    }

    const data = await response.json();
    const summary =
      data.content?.[0]?.text ?? generateFallbackSummary(sessionName, events);

    await updateSessionSummary(sessionId, summary);
    return { summary };
  } catch (e) {
    console.error("[summary] Failed to generate summary:", e);
    const summary = generateFallbackSummary(sessionName, events);
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
