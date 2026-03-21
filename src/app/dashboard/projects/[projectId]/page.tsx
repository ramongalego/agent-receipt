import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getProjectById } from "@/db/queries/projects";
import { getUserTeam, getUserRole } from "@/lib/access";
import { getSessionsByProject } from "@/db/queries/sessions";
import { computeSessionStatus } from "@/lib/session-status";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FormattedDate } from "@/components/ui/formatted-date";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}): Promise<Metadata> {
  const { projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) return { title: "Project" };
  const team = await getUserTeam(session.user.id);
  const project = await getProjectById(projectId, team.id);
  return { title: project?.name ?? "Project" };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  const team = await getUserTeam(session!.user!.id!);
  const role = await getUserRole(session!.user!.id!, team.id);
  const project = await getProjectById(projectId, team.id);

  if (!project) {
    notFound();
  }

  const { rows: recentSessions } = await getSessionsByProject(projectId, 1, 10);

  function formatDuration(start: Date, end: Date | string | null) {
    if (!end) return null;
    const endDate = end instanceof Date ? end : new Date(end);
    const ms = endDate.getTime() - new Date(start).getTime();
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 60_000)}m`;
  }

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Projects
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {project.description}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Created <FormattedDate date={project.createdAt} format="date" />
            </p>
          </div>
          {role === "owner" && (
            <Link
              href={`/dashboard/projects/${projectId}/settings`}
              className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-sm transition-colors hover:bg-muted"
            >
              Project Settings
            </Link>
          )}
        </div>

        {/* Recent Sessions */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              Recent sessions
            </h2>
            <div className="h-px flex-1 bg-border" />
            {recentSessions.length > 0 && (
              <Link
                href={`/dashboard/projects/${projectId}/sessions`}
                className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                View all
              </Link>
            )}
          </div>

          {recentSessions.length === 0 ? (
            <EmptyState
              title="No sessions yet"
              description="Sessions appear here once your agent starts sending events through the SDK."
            />
          ) : (
            <Card>
              <div className="divide-y divide-border">
                {recentSessions.map((s) => {
                  const status = computeSessionStatus({
                    lastEventAt: s.lastEventAt,
                    hasError: s.hasError ?? false,
                    hasLimitReached: s.hasLimitReached ?? false,
                  });
                  return (
                    <Link
                      key={s.id}
                      href={`/dashboard/projects/${projectId}/sessions/${s.id}`}
                      className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-card-foreground">
                          {s.name || "Untitled session"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <FormattedDate date={s.startedAt} />
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">
                          {s.eventCount} event{s.eventCount !== 1 ? "s" : ""}
                        </span>
                        {formatDuration(s.startedAt, s.lastEventAt) && (
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(s.startedAt, s.lastEventAt)}
                          </span>
                        )}
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
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
