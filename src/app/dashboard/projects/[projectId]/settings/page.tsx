import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProjectById } from "@/db/queries/projects";
import { getUserTeamCached, getUserRole } from "@/lib/access";
import { getApiKeysByProject } from "@/db/queries/api-keys";
import { ApiKeysSection } from "../api-keys-section";
import { ProjectSettingsForm, DangerZone } from "./settings-form";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  const team = await getUserTeamCached(session!.user!.id!);
  const [role, project, apiKeys] = await Promise.all([
    getUserRole(session!.user!.id!, team.id),
    getProjectById(projectId, team.id),
    getApiKeysByProject(projectId),
  ]);

  if (!project) {
    notFound();
  }
  const isOwner = role === "owner";

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-2xl font-bold text-foreground">
          Project settings
        </h1>

        <ProjectSettingsForm
          projectId={projectId}
          initialName={project.name}
          initialDescription={project.description}
          isOwner={isOwner}
        />

        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            API keys
          </h2>
          <ApiKeysSection
            projectId={projectId}
            initialKeys={apiKeys}
            isOwner={isOwner}
          />
        </section>

        {isOwner && <DangerZone projectId={projectId} />}
      </div>
    </div>
  );
}
