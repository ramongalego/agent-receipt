import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserTeam, getUserRole } from "@/lib/access";

export default async function NewProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const team = await getUserTeam(session.user.id);
  const role = await getUserRole(session.user.id, team.id);

  if (role !== "owner") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
