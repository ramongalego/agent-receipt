import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { agentSessions } from "@/db/schema";
import { getProjectById } from "@/db/queries/projects";
import { getUserTeamCached, getUserRole } from "@/lib/access";
import { getSessionById, getEventsBySession } from "@/db/queries/sessions";
import { verifyChain } from "@/lib/hash";
import { computeSessionStatus } from "@/lib/session-status";
import { getTeamPlan } from "@/lib/anchor-session";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EventTimeline } from "./event-timeline";
import { ReceiptSummary } from "./receipt-summary";
import { HashChainBadge } from "@/components/ui/hash-chain-badge";
import { RekorBadge } from "./rekor-badge";
import { AnchorTrigger } from "./anchor-trigger";
import { ShareButton } from "./share-modal";
import { FormattedDate } from "@/components/ui/formatted-date";
import { CollapsibleContextCard } from "@/components/ui/collapsible-context-card";

const getCachedProject = cache((projectId: string, teamId: string) =>
  getProjectById(projectId, teamId),
);
const getCachedSession = cache((sessionId: string, projectId: string) =>
  getSessionById(sessionId, projectId),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string; sessionId: string }>;
}): Promise<Metadata> {
  const { projectId, sessionId } = await params;
  const session = await auth();
  if (!session?.user?.id) return { title: "Session" };
  const team = await getUserTeamCached(session.user.id);
  const project = await getCachedProject(projectId, team.id);
  if (!project) return { title: "Session" };
  const agentSession = await getCachedSession(sessionId, projectId);
  return { title: agentSession?.name ?? agentSession?.id ?? "Session" };
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; sessionId: string }>;
}) {
  const { projectId, sessionId } = await params;
  const userSession = await auth();
  const team = await getUserTeamCached(userSession!.user!.id!);
  const [project, initialSession, events] = await Promise.all([
    getCachedProject(projectId, team.id),
    getCachedSession(sessionId, projectId),
    getEventsBySession(sessionId),
  ]);

  if (!project) {
    notFound();
  }

  if (!initialSession) {
    notFound();
  }

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
    explicitlyCompletedAt: initialSession.explicitlyCompletedAt,
  });

  // Determine if anchoring should be triggered on this load.
  // Set pending synchronously so the badge renders as "Anchoring..." immediately.
  // The actual Rekor call is handled by the AnchorTrigger client component via API route.
  const [plan, role] = await Promise.all([
    getTeamPlan(team.id),
    getUserRole(userSession!.user!.id!, team.id),
  ]);
  let agentSession = initialSession;
  const shouldAnchor =
    status === "complete" &&
    agentSession.rekorStatus === null &&
    plan !== "free";

  if (shouldAnchor) {
    await db
      .update(agentSessions)
      .set({ rekorStatus: "pending" })
      .where(eq(agentSessions.id, sessionId));

    agentSession = { ...agentSession, rekorStatus: "pending" };
  }

  const totalDuration =
    events.length > 0
      ? events[events.length - 1].timestamp.getTime() -
        agentSession.startedAt.getTime()
      : 0;

  function formatDuration(ms: number) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 60_000)}m`;
  }

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="transition-colors hover:text-foreground"
          >
            {project.name}
          </Link>
          <span>/</span>
          <Link
            href={`/dashboard/projects/${projectId}/sessions`}
            className="transition-colors hover:text-foreground"
          >
            Sessions
          </Link>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {agentSession.name || "Untitled session"}
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
                  {events.length} events
                </span>
                <span className="text-xs text-muted-foreground/70">
                  {formatDuration(totalDuration)} total
                </span>
                <span className="text-xs text-muted-foreground/70">
                  <FormattedDate
                    date={agentSession.startedAt}
                    format="date-short"
                  />
                  ,{" "}
                  <FormattedDate date={agentSession.startedAt} format="time" />
                </span>
              </div>
            </div>
            {role === "owner" && (
              <ShareButton
                sessionId={sessionId}
                existingToken={agentSession.shareToken}
                existingTokenCreatedAt={agentSession.shareTokenCreatedAt}
              />
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <HashChainBadge valid={chainValid} />
            <RekorBadge
              rekorStatus={agentSession.rekorStatus}
              rekorUuid={agentSession.rekorUuid}
              rekorLogIndex={agentSession.rekorLogIndex}
              plan={plan}
              sessionId={sessionId}
            />
          </div>
        </div>

        <AnchorTrigger shouldAnchor={shouldAnchor} sessionId={sessionId} />

        {/* Receipt Summary, only shown for complete/error sessions */}
        {status !== "running" && (
          <Card>
            <div className="px-5 py-4">
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
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
                <h2 className="text-base font-semibold">Receipt summary</h2>
              </div>
            </div>
            <div className="border-t border-border px-5 pb-5 pt-4">
              <ReceiptSummary
                sessionId={sessionId}
                existingSummary={agentSession.summary}
                autoGenerate={status === "complete" && !agentSession.summary}
              />
            </div>
          </Card>
        )}

        {/* Decision Context, collapsible, shown when session has context */}
        {agentSession.context && (
          <div className="mt-6">
            <CollapsibleContextCard context={agentSession.context} />
          </div>
        )}

        {/* Event Timeline */}
        <Card className="mt-6">
          <div className="px-5 py-4">
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
          </div>
          <EventTimeline
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
          Article 17. Contact support to request payload deletion for a session.
        </p>
      </div>
    </div>
  );
}
