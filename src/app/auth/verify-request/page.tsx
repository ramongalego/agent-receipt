import Link from "next/link";
import { PublicNav } from "@/components/layout/public-nav";

export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNav />

      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
              <svg
                className="h-7 w-7 text-accent-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Check your email
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              We sent a sign-in link to your email address. Click the link to
              continue.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>The link will expire in 24 hours.</p>
              <p>
                If you do not see the email, check your spam folder or try
                signing in again.
              </p>
            </div>
            <Link
              href="/sign-in"
              className="mt-5 inline-block text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
