import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserTeam, getUserRole } from "@/lib/access";
import { getTeamMembers, getPendingInvites } from "@/db/queries/invites";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WorkspaceSection } from "./workspace-section";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function GeneralSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const team = await getUserTeam(session.user.id!);
  const role = await getUserRole(session.user.id!, team.id);
  const members = await getTeamMembers(team.id);
  const pendingInvites =
    role === "owner" ? await getPendingInvites(team.id) : [];

  // Filter out expired invites on the server
  const activeInvites = pendingInvites.filter(
    (inv) => inv.expiresAt > new Date(),
  );

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-2xl font-bold text-foreground">Settings</h1>

        <WorkspaceSection
          teamName={team.name}
          members={members}
          pendingInvites={activeInvites}
          isOwner={role === "owner"}
          currentUserId={session.user.id!}
        />

        <div className="mt-8">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-card-foreground">Profile</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
                {session.user.name && (
                  <div>
                    <p className="text-sm font-medium text-foreground">Name</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {session.user.name}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
