"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PublicNav } from "@/components/layout/public-nav";
import { highlightJson } from "@/lib/highlight";

type DemoEvent = {
  id: string;
  type: "llm_call" | "tool_call" | "decision";
  name: string;
  durationMs: number;
  timestamp: string;
  input: unknown;
  output: unknown;
};

const DEMO_EVENTS: DemoEvent[] = [
  {
    id: "evt_001",
    type: "llm_call",
    name: "Parse invoice",
    durationMs: 2340,
    timestamp: "2026-03-13T10:00:12.000Z",
    input: {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content:
            "Extract the structured data from this invoice:\n\nInvoice #441\nFrom: Acme Corp\nTo: Widget Inc\nDate: 2026-03-10\nAmount: $4,500.00\nDescription: Q1 consulting services\nDue: 2026-04-10",
        },
      ],
    },
    output: {
      invoiceNumber: "441",
      vendor: "Acme Corp",
      recipient: "Widget Inc",
      amount: 4500.0,
      currency: "USD",
      description: "Q1 consulting services",
      issueDate: "2026-03-10",
      dueDate: "2026-04-10",
    },
  },
  {
    id: "evt_002",
    type: "tool_call",
    name: "Look up vendor",
    durationMs: 180,
    timestamp: "2026-03-13T10:00:14.500Z",
    input: {
      vendorName: "Acme Corp",
    },
    output: {
      id: "vendor_0042",
      name: "Acme Corp",
      verified: true,
      bankAccount: "****7890",
      autoApprovalLimit: 5000.0,
      totalPaid: 27500.0,
      invoiceCount: 8,
    },
  },
  {
    id: "evt_003",
    type: "decision",
    name: "Approve payment",
    durationMs: 0,
    timestamp: "2026-03-13T10:00:14.700Z",
    input: {
      reasoning:
        "Invoice amount $4,500 is within the $5,000 auto-approval limit for Acme Corp. Vendor is verified. No anomalies detected.",
    },
    output: {
      outcome: "approved",
      approvalType: "automatic",
    },
  },
  {
    id: "evt_004",
    type: "tool_call",
    name: "Trigger payment",
    durationMs: 1200,
    timestamp: "2026-03-13T10:00:15.900Z",
    input: {
      vendorId: "vendor_0042",
      amount: 4500.0,
      currency: "USD",
      reference: "INV-441",
    },
    output: {
      paymentId: "pay_8x9k2m",
      status: "initiated",
      estimatedArrival: "2026-03-14",
    },
  },
];

const DEMO_SUMMARY =
  "The agent processed invoice #441 from Acme Corp for $4,500. It parsed the invoice text to extract structured data, then looked up Acme Corp in the vendor database and confirmed they are a verified vendor. Because the amount was within the $5,000 auto-approval limit, the agent approved the payment automatically. It then triggered a bank transfer to Acme Corp, which was initiated successfully.";

type EventTypeBadgeVariant = "info" | "default" | "warning";

const eventTypeBadge: Record<string, EventTypeBadgeVariant> = {
  llm_call: "info",
  tool_call: "default",
  decision: "warning",
};

const eventTypeLabel: Record<string, string> = {
  llm_call: "LLM Call",
  tool_call: "Tool Call",
  decision: "Decision",
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

export default function DemoPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />

      <div className="mx-auto max-w-4xl px-6 pb-24 pt-10">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Sample receipt</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Process invoice #441
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Badge variant="success">complete</Badge>
                <span className="text-muted-foreground/40">|</span>
                <span className="text-xs text-muted-foreground/70">
                  4 events
                </span>
                <span className="text-xs text-muted-foreground/70">
                  3.7s total
                </span>
                <span className="text-xs text-muted-foreground/70">
                  Mar 13, 2026, 10:00 AM
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950/30">
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
                Hash chain verified
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground/60">
            Event metadata and hash records are immutable. Raw payload content
            is stored separately and can be deleted on request to comply with
            GDPR Article 17.
          </p>
        </div>

        {/* Summary */}
        <Card>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
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
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              <h2 className="text-base font-semibold">Receipt summary</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {DEMO_SUMMARY}
            </p>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="mt-6">
          <CardHeader>
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
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <h2 className="text-base font-semibold">Event timeline</h2>
            </div>
          </CardHeader>
          <div className="divide-y divide-border">
            {DEMO_EVENTS.map((event, index) => (
              <div key={event.id}>
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

                {expandedId === event.id && (
                  <div className="border-t border-border bg-muted/50 px-5 py-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Input
                        </p>
                        <TruncatedJson data={event.input} />
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Output
                        </p>
                        <TruncatedJson data={event.output} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Hash chain verification detail */}
        <Card className="mt-6">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
                  <svg
                    width="20"
                    height="20"
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
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Hash chain integrity verified
                  </p>
                  <p className="text-xs text-muted-foreground">
                    All 4 events have valid SHA-256 hashes. No tampering
                    detected.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                View hash log
              </button>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-border bg-muted/50 p-10 text-center sm:p-14">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            This is what every agent run looks like in AgentReceipt
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            Get a clear, tamper-proof record of every action your AI agent
            takes. Free plan includes 100 sessions per month.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-in"
              className="inline-flex w-full items-center justify-center rounded-xl bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/85 sm:w-auto"
            >
              Start for free
            </Link>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-xl border border-border px-8 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground sm:w-auto"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AgentReceipt
          </span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link
              href="/docs"
              className="transition-colors hover:text-foreground"
            >
              Docs
            </Link>
            <Link
              href="/sign-in"
              className="transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
