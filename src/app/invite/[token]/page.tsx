import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getInviteByToken, acceptInvite } from "@/db/queries/invites";
import { PublicNav } from "@/components/layout/public-nav";

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNav />
      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm space-y-8">{children}</div>
      </div>
    </div>
  );
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite) {
    return (
      <PageShell>
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
            <svg
              className="h-7 w-7 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Invite not found
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This invite link has expired or has already been accepted. Ask your
            workspace owner to send a new one.
          </p>
        </div>
        <div className="flex justify-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90"
          >
            Go to sign in
          </Link>
        </div>
      </PageShell>
    );
  }

  const session = await auth();

  if (!session?.user) {
    return (
      <PageShell>
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
            <svg
              className="h-7 w-7 text-accent-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Join {invite.teamName}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            You have been invited to join this workspace. Sign in to accept.
          </p>
        </div>
        <div className="flex justify-center">
          <Link
            href={`/sign-in?callbackUrl=/invite/${token}`}
            className="inline-flex items-center rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90"
          >
            Sign in to accept
          </Link>
        </div>
      </PageShell>
    );
  }

  if (
    session.user.email &&
    invite.email.toLowerCase() !== session.user.email.toLowerCase()
  ) {
    return (
      <PageShell>
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-50 dark:bg-yellow-950/30">
            <svg
              className="h-7 w-7 text-yellow-600 dark:text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Email mismatch
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This invite was sent to{" "}
            <span className="font-medium text-foreground">{invite.email}</span>.
            You are signed in as{" "}
            <span className="font-medium text-foreground">
              {session.user.email}
            </span>
            . Sign in with the invited address to accept.
          </p>
        </div>
        <div className="flex justify-center">
          <Link
            href={`/sign-in?callbackUrl=/invite/${token}`}
            className="inline-flex items-center rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90"
          >
            Sign in with a different account
          </Link>
        </div>
      </PageShell>
    );
  }

  await acceptInvite(token, session.user.id!);
  redirect("/dashboard");
}
