import Link from "next/link";
import { auth } from "@/lib/auth";
import { getProjectsByUser } from "@/db/queries/projects";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormattedDate } from "@/components/ui/formatted-date";

export default async function DashboardPage() {
  const session = await auth();
  const projects = await getProjectsByUser(session!.user!.id!);

  if (projects.length === 0) {
    return (
      <div className="px-6 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-8 text-2xl font-bold text-foreground">Projects</h1>
          <EmptyState
            title="No projects yet"
            description="A project represents one of your AI agents. Create a project to get an API key and start capturing receipts."
            action={
              <Link
                href="/dashboard/projects/new"
                className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
              >
                Create project
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
          >
            Create project
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="group block"
            >
              <Card className="transition-all duration-150 group-hover:border-muted-foreground/30 group-hover:shadow-md">
                <CardContent>
                  <h3 className="font-semibold text-card-foreground">
                    {project.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Created{" "}
                    <FormattedDate
                      date={project.createdAt}
                      format="date-short"
                    />
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {project.sessionCount}{" "}
                      {project.sessionCount === 1 ? "session" : "sessions"}
                    </span>
                    <Badge variant={project.hasApiKey ? "success" : "warning"}>
                      {project.hasApiKey ? "API key active" : "No API key"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
