import type { Metadata } from "next";
import Link from "next/link";
import { getSessionByShareToken } from "@/db/queries/sessions";
import { verifyChain } from "@/lib/hash";
import { computeSessionStatus } from "@/lib/session-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HashChainBadge } from "@/components/ui/hash-chain-badge";
import { PublicEventTimeline } from "./public-event-timeline";

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { token } = await params;
  const result = await getSessionByShareToken(token);

  if (!result) {
    return { title: "Invalid link" };
  }

  return {
    title: `${result.session.name || "Untitled session"} · AgentReceipt`,
    description: `AI agent receipt shared by ${result.session.teamName}. View the full audit trail of every action.`,
  };
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60_000)}m`;
}

function StaticRekorBadge({
  rekorStatus,
  rekorLogIndex,
}: {
  rekorStatus: string | null;
  rekorLogIndex: number | null;
}) {
  if (rekorStatus !== "anchored") return null;

  return (
    <a
      href={`https://search.sigstore.dev/?logIndex=${rekorLogIndex}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:hover:bg-green-950/50"
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
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-green-500 dark:text-green-400"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
}

export default async function SharedReceiptPage({ params }: PageProps) {
  const { token } = await params;
  const result = await getSessionByShareToken(token);

  if (!result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Link invalid or revoked
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This link is invalid or has been revoked. The receipt may no longer
            be shared.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/85"
          >
            Go to agentreceipt.co
          </Link>
        </div>
      </div>
    );
  }

  const { session, events } = result;
  const chainValid = verifyChain(events);

  const hasError = events.some((e) => e.type === "error");
  const hasLimitReached = events.some(
    (e) => e.name === "session.limit_reached",
  );
  const lastEventAt =
    events.length > 0 ? events[events.length - 1].timestamp : null;
  const status = computeSessionStatus({
    lastEventAt,
    hasError,
    hasLimitReached,
    explicitlyCompletedAt: session.explicitlyCompletedAt,
  });

  const totalDuration =
    events.length > 0
      ? events[events.length - 1].timestamp.getTime() -
        session.startedAt.getTime()
      : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Shared banner */}
      <div className="border-b border-border bg-muted/50 px-6 py-2.5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Shared by {session.teamName} · View only
          </p>
          <Link
            href="/"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            AgentReceipt
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {session.name || "Untitled session"}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Badge
                  variant={
                    status === "complete"
                      ? "success"
                      : status === "error"
                        ? "error"
                        : "info"
                  }
                >
                  {status}
                </Badge>
                <span className="text-muted-foreground/40">|</span>
                <span className="text-xs text-muted-foreground/70">
                  {session.projectName}
                </span>
                <span className="text-xs text-muted-foreground/70">
                  {events.length} events
                </span>
                <span className="text-xs text-muted-foreground/70">
                  {formatDuration(totalDuration)} total
                </span>
                <span className="text-xs text-muted-foreground/70">
                  {session.startedAt.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  , {session.startedAt.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <HashChainBadge valid={chainValid} />
            <StaticRekorBadge
              rekorStatus={session.rekorStatus}
              rekorLogIndex={session.rekorLogIndex}
            />
          </div>
        </div>

        {/* Receipt Summary */}
        {session.summary && (
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
                {session.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Event Timeline */}
        <Card className={session.summary ? "mt-6" : ""}>
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
          <PublicEventTimeline
            shareToken={token}
            events={events.map((e) => ({
              ...e,
              metadata: e.metadata as
                | Record<string, unknown>
                | null
                | undefined,
              compliance: e.compliance ?? null,
            }))}
          />
        </Card>

        <p className="mt-8 text-xs text-muted-foreground/60">
          Event metadata and hash records are immutable. Raw payload content is
          stored separately and can be deleted on request to comply with GDPR
          Article 17.
        </p>
      </div>
    </div>
  );
}
