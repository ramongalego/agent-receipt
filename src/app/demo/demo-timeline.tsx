"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { highlightJson } from "@/lib/highlight";

type DemoEvent = {
  id: string;
  type: "llm_call" | "tool_call" | "decision" | "context_change";
  name: string;
  durationMs: number;
  timestamp: string;
  input: unknown;
  output: unknown;
  context?: unknown;
};

type EventTypeBadgeVariant = "info" | "default" | "warning";

const eventTypeBadge: Record<string, EventTypeBadgeVariant> = {
  llm_call: "info",
  tool_call: "default",
  decision: "warning",
  context_change: "warning",
};

const eventTypeLabel: Record<string, string> = {
  llm_call: "LLM Call",
  tool_call: "Tool Call",
  decision: "Decision",
  context_change: "Context Changed",
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

function DemoEventExpanded({ event }: { event: DemoEvent }) {
  const [activeTab, setActiveTab] = useState<"payload" | "context">("payload");

  return (
    <div className="border-t border-border bg-muted/50 px-5 py-4">
      {event.context != null && (
        <div className="mb-4 flex gap-4 border-b border-border text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("payload")}
            className={`-mb-px border-b-2 pb-2 transition-colors ${activeTab === "payload" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Input / Output
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("context")}
            className={`-mb-px border-b-2 pb-2 transition-colors ${activeTab === "context" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Context
          </button>
        </div>
      )}
      {activeTab === "payload" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {event.type === "context_change" ? "Previous" : "Input"}
            </p>
            <TruncatedJson data={event.input} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {event.type === "context_change" ? "Current" : "Output"}
            </p>
            <TruncatedJson data={event.output} />
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Decision context
          </p>
          <TruncatedJson data={event.context} />
        </div>
      )}
    </div>
  );
}

export function DemoTimeline({ events }: { events: DemoEvent[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="divide-y divide-border">
      {events.map((event, index) => (
        <div
          key={event.id}
          className={`${event.type === "context_change" ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}`}
        >
          <button
            type="button"
            onClick={() =>
              setExpandedId(expandedId === event.id ? null : event.id)
            }
            className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] font-medium text-muted-foreground">
                {index + 1}
              </span>
              <Badge variant={eventTypeBadge[event.type] ?? "default"}>
                {eventTypeLabel[event.type] ?? event.type}
              </Badge>
              <span className="text-sm font-medium">{event.name}</span>
            </div>
            <div className="flex items-center gap-3">
              {event.durationMs > 0 && (
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

          {expandedId === event.id && <DemoEventExpanded event={event} />}
        </div>
      ))}
    </div>
  );
}

type DemoSessionContext = {
  systemPrompt?: string;
  activeRules?: {
    id: string;
    description: string;
    parameters?: Record<string, unknown>;
  }[];
  permissions?: string[];
  environment?: Record<string, unknown>;
};

export function DemoContextCard({ context }: { context: DemoSessionContext }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h2 className="text-base font-semibold">Decision context</h2>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          <div className="space-y-4">
            {context.systemPrompt && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  System prompt
                </p>
                <div className="max-h-48 overflow-auto rounded-lg border border-border bg-card px-4 py-3 text-sm leading-relaxed">
                  <span className="text-green-700 dark:text-green-300">
                    &ldquo;{context.systemPrompt}&rdquo;
                  </span>
                </div>
              </div>
            )}
            {context.activeRules && context.activeRules.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Active rules
                </p>
                <div className="space-y-2">
                  {context.activeRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="rounded-lg border border-border bg-muted px-4 py-2.5"
                    >
                      <span className="text-xs font-bold text-foreground">
                        {rule.id}
                      </span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {rule.description}
                      </p>
                      {rule.parameters &&
                        Object.keys(rule.parameters).length > 0 && (
                          <pre
                            className="mt-1.5 rounded border border-border bg-card px-3 py-2 font-mono text-xs leading-relaxed"
                            style={{
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                            dangerouslySetInnerHTML={{
                              __html: highlightJson(
                                JSON.stringify(rule.parameters, null, 2),
                              ),
                            }}
                          />
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {context.permissions && context.permissions.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Permissions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {context.permissions.map((perm) => (
                    <Badge key={perm} variant="default">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {context.environment &&
              Object.keys(context.environment).length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Environment
                  </p>
                  <pre
                    className="max-h-32 overflow-auto rounded-lg border border-border bg-card px-4 py-3 font-mono text-xs leading-relaxed"
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: highlightJson(
                        JSON.stringify(context.environment, null, 2),
                      ),
                    }}
                  />
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DemoRekorBadge() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <div
        className="flex cursor-default items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950/30"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-green-600 dark:text-green-400"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 12 15 16 10" />
        </svg>
        <span className="text-sm font-medium text-green-700 dark:text-green-300">
          Anchored on Rekor
        </span>
      </div>
      {showTooltip && (
        <div className="absolute left-0 top-full z-10 mt-2 w-72 rounded-lg border border-border bg-zinc-900 p-3 text-xs text-zinc-300 shadow-lg dark:bg-zinc-900">
          An independent public log that proves this receipt existed at this
          time and has not been changed. Available on Pro and Business plans.
        </div>
      )}
    </div>
  );
}
