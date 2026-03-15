import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectById } from "@/db/queries/projects";
import { getSessionsByProject } from "@/db/queries/sessions";
import { computeSessionStatus } from "@/lib/session-status";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormattedDate } from "@/components/ui/formatted-date";

const PAGE_SIZE = 20;

export default async function SessionsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { projectId } = await params;
  const { page: pageParam } = await searchParams;
  const session = await auth();
  const project = await getProjectById(projectId, session!.user!.id!);

  if (!project) {
    notFound();
  }

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const { rows: sessions, total } = await getSessionsByProject(
    projectId,
    page,
    PAGE_SIZE,
  );
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function formatDuration(start: Date, end: Date | string | null) {
    if (!end) return "—";
    const endDate = end instanceof Date ? end : new Date(end);
    const ms = endDate.getTime() - new Date(start).getTime();
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 60_000)}m`;
  }

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {project.name}
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-foreground">Sessions</h1>
        </div>

        {sessions.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            description="Sessions appear here once your agent starts sending events through the SDK."
          />
        ) : (
          <>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Started</th>
                      <th className="px-6 py-3">Duration</th>
                      <th className="px-6 py-3">Events</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sessions.map((s) => {
                      const status = computeSessionStatus({
                        lastEventAt: s.lastEventAt,
                        hasError: s.hasError ?? false,
                        hasLimitReached: s.hasLimitReached ?? false,
                      });
                      return (
                        <tr
                          key={s.id}
                          className="transition-colors hover:bg-muted/50"
                        >
                          <td className="px-6 py-4">
                            <Link
                              href={`/dashboard/projects/${projectId}/sessions/${s.id}`}
                              className="text-sm font-medium text-foreground hover:underline"
                            >
                              {s.name || "Untitled session"}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            <FormattedDate date={s.startedAt} />
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {formatDuration(s.startedAt, s.lastEventAt)}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {s.eventCount}
                          </td>
                          <td className="px-6 py-4">
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-4">
                {page > 1 ? (
                  <Link
                    href={`/dashboard/projects/${projectId}/sessions?page=${page - 1}`}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-sm transition-colors hover:bg-muted"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground opacity-50 shadow-sm">
                    Previous
                  </span>
                )}
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={`/dashboard/projects/${projectId}/sessions?page=${page + 1}`}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-sm transition-colors hover:bg-muted"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground opacity-50 shadow-sm">
                    Next
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
