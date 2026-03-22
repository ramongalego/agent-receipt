"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { highlightJson } from "@/lib/highlight";
import { fetchEventPayload } from "./actions";

type TimelineEvent = {
  id: string;
  type: string;
  name: string;
  durationMs: number | null;
  timestamp: Date;
  hash: string;
  metadata?: Record<string, unknown> | null;
  compliance?: {
    containsPII?: boolean;
    dataCategory?: string;
    retentionOverride?: number;
  } | null;
};

type EventTimelineProps = {
  events: TimelineEvent[];
};

type EventTypeBadgeVariant =
  | "info"
  | "default"
  | "warning"
  | "error"
  | "purple";

const eventTypeBadge: Record<string, EventTypeBadgeVariant> = {
  llm_call: "info",
  tool_call: "default",
  decision: "warning",
  error: "error",
  human_review: "purple",
};

const eventTypeLabel: Record<string, string> = {
  llm_call: "LLM Call",
  tool_call: "Tool Call",
  decision: "Decision",
  error: "Error",
  human_review: "Human Review",
};

const STRING_LIMIT = 500;

function truncateStrings(value: unknown): unknown {
  if (typeof value === "string" && value.length > STRING_LIMIT) {
    return value.slice(0, STRING_LIMIT);
  }
  if (Array.isArray(value)) {
    return value.map(truncateStrings);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        truncateStrings(v),
      ]),
    );
  }
  return value;
}

function hasLongStrings(value: unknown): boolean {
  if (typeof value === "string") return value.length > STRING_LIMIT;
  if (Array.isArray(value)) return value.some(hasLongStrings);
  if (value !== null && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(hasLongStrings);
  }
  return false;
}

function formatJson(json: string, pretty: boolean): string {
  if (!pretty) return json;
  return json.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
}

function TruncatedJson({ data }: { data: unknown }) {
  const [showFull, setShowFull] = useState(false);
  const [pretty, setPretty] = useState(true);
  const needsTruncation = hasLongStrings(data);
  const display = showFull || !needsTruncation ? data : truncateStrings(data);
  const raw = JSON.stringify(display, null, 2);
  const json = formatJson(raw, pretty);
  const highlighted = pretty ? highlightJson(json) : null;
  const ellipsis = !showFull && needsTruncation;

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1 rounded-md border border-border bg-muted p-0.5 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setPretty(true)}
            className={`rounded px-2 py-0.5 transition-colors ${pretty ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Pretty
          </button>
          <button
            type="button"
            onClick={() => setPretty(false)}
            className={`rounded px-2 py-0.5 transition-colors ${!pretty ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Raw
          </button>
        </div>
        {needsTruncation && (
          <button
            type="button"
            onClick={() => setShowFull(!showFull)}
            className="text-xs font-medium text-indigo-500 transition-colors hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {showFull ? "Show less" : "Show full"}
          </button>
        )}
      </div>
      {highlighted ? (
        <pre
          className="max-h-72 overflow-auto rounded-lg border border-border bg-card px-5 py-4 font-mono text-xs leading-relaxed text-card-foreground"
          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          dangerouslySetInnerHTML={{
            __html:
              highlighted +
              (ellipsis
                ? '<span class="text-muted-foreground">...</span>'
                : ""),
          }}
        />
      ) : (
        <pre
          className="max-h-72 overflow-auto rounded-lg border border-border bg-card px-5 py-4 font-mono text-xs leading-relaxed text-card-foreground"
          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        >
          {json}
          {ellipsis && <span className="text-muted-foreground">...</span>}
        </pre>
      )}
    </>
  );
}

const decisionColor: Record<string, string> = {
  approved: "text-green-600 dark:text-green-400",
  rejected: "text-red-600 dark:text-red-400",
  modified: "text-yellow-600 dark:text-yellow-400",
};

function HumanReviewDetail({
  metadata,
}: {
  metadata?: Record<string, unknown> | null;
}) {
  if (!metadata) return null;
  const reviewer = metadata.reviewer as string | undefined;
  const decision = metadata.decision as string | undefined;
  const notes = metadata.notes as string | undefined;

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Reviewer
        </p>
        <p className="text-sm text-foreground">{reviewer ?? "Unknown"}</p>
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Decision
        </p>
        <p
          className={`text-sm font-medium ${decision ? (decisionColor[decision] ?? "text-foreground") : "text-foreground"}`}
        >
          {decision ?? "Unknown"}
        </p>
      </div>
      {notes && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Notes
          </p>
          <p className="text-sm text-foreground">{notes}</p>
        </div>
      )}
    </div>
  );
}

function PiiBadge({ dataCategory }: { dataCategory?: string }) {
  const label = `Contains personally identifiable information${dataCategory ? `. Category: ${dataCategory}` : ""}`;
  return (
    <span className="group relative">
      <span className="rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-400">
        PII
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-[11px] text-background group-hover:block">
        {label}
      </span>
    </span>
  );
}

const PAGE_SIZE = 50;

export function EventTimeline({ events: rawEvents }: EventTimelineProps) {
  const events = rawEvents.filter((e) => e.name !== "session.end");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payload, setPayload] = useState<{
    input?: unknown;
    output?: unknown;
  } | null>(null);
  const [loadingPayload, setLoadingPayload] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  async function toggleExpand(eventId: string) {
    if (expandedId === eventId) {
      setExpandedId(null);
      setPayload(null);
      return;
    }

    setExpandedId(eventId);
    setLoadingPayload(true);

    try {
      const result = await fetchEventPayload(eventId);
      if ("data" in result) {
        setPayload(result.data as { input?: unknown; output?: unknown });
      } else {
        setPayload({ input: { error: "Failed to load payload." } });
      }
    } catch {
      setPayload({ input: { error: "Failed to load payload." } });
    } finally {
      setLoadingPayload(false);
    }
  }

  if (events.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-sm text-muted-foreground">
        No events in this session.
      </div>
    );
  }

  const visibleEvents = events.slice(0, visibleCount);
  const hasMore = visibleCount < events.length;

  return (
    <div>
      {events.length > PAGE_SIZE && (
        <div className="border-b border-border px-5 py-2 text-xs text-muted-foreground">
          Showing {visibleEvents.length} of {events.length} events
        </div>
      )}
      <div className="divide-y divide-border">
        {visibleEvents.map((event, index) => (
          <div
            key={event.id}
            className={`${event.type === "error" ? "bg-red-50/50 dark:bg-red-950/10" : ""}`}
          >
            <button
              type="button"
              onClick={() => toggleExpand(event.id)}
              className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] font-medium text-muted-foreground">
                  {index + 1}
                </span>
                <Badge variant={eventTypeBadge[event.type] ?? "default"}>
                  {eventTypeLabel[event.type] ?? event.type}
                </Badge>
                <span className="text-sm font-medium text-foreground">
                  {event.name}
                </span>
                {(event.compliance?.containsPII ||
                  event.compliance?.dataCategory) && (
                  <PiiBadge dataCategory={event.compliance.dataCategory} />
                )}
              </div>
              <div className="flex items-center gap-3">
                {event.durationMs !== null && event.durationMs > 0 && (
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {event.durationMs}ms
                  </span>
                )}
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-muted-foreground transition-transform ${expandedId === event.id ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>

            {expandedId === event.id && (
              <div className="border-t border-border bg-muted/50 px-5 py-4">
                {event.type === "human_review" ? (
                  <HumanReviewDetail metadata={event.metadata} />
                ) : loadingPayload ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Loading payload...
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Input
                      </p>
                      <TruncatedJson data={payload?.input ?? null} />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Output
                      </p>
                      <TruncatedJson data={payload?.output ?? null} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="border-t border-border px-5 py-3 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Show more events
          </button>
        </div>
      )}
    </div>
  );
}
