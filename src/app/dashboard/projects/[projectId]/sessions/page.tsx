import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectById } from "@/db/queries/projects";
import { getUserTeam } from "@/lib/access";
import { getSessionsByProject } from "@/db/queries/sessions";
import { computeSessionStatus } from "@/lib/session-status";
import { EmptyState } from "@/components/ui/empty-state";
import { SessionsTable } from "./sessions-table";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}): Promise<Metadata> {
  const { projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) return { title: "Sessions" };
  const team = await getUserTeam(session.user.id);
  const project = await getProjectById(projectId, team.id);
  return { title: `Sessions \u00B7 ${project?.name ?? "Project"}` };
}

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
  const team = await getUserTeam(session!.user!.id!);
  const project = await getProjectById(projectId, team.id);

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

  const sessionRows = sessions.map((s) => ({
    id: s.id,
    name: s.name,
    startedAt: s.startedAt,
    lastEventAt: s.lastEventAt,
    eventCount: s.eventCount,
    status: computeSessionStatus({
      lastEventAt: s.lastEventAt,
      hasError: s.hasError ?? false,
      hasLimitReached: s.hasLimitReached ?? false,
    }),
    duration: formatDuration(s.startedAt, s.lastEventAt),
  }));

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
            <SessionsTable sessions={sessionRows} projectId={projectId} />

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
