import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
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

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="flex">
        <DesktopSidebar />
        <main className="min-h-screen flex-1">
          <Suspense>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
