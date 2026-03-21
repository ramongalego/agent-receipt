import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserTeamCached } from "@/lib/access";
import { DesktopSidebar, MobileHeader } from "@/components/layout/sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  let workspaceName: string | undefined;
  try {
    const team = await getUserTeamCached(session.user.id!);
    workspaceName = team.name;
  } catch {
    // Team may not exist yet for brand new users mid-creation
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader workspaceName={workspaceName} />
      <div className="flex">
        <DesktopSidebar workspaceName={workspaceName} />
        <main className="min-h-screen flex-1">
          <Suspense>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
