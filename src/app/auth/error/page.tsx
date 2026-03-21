"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PublicNav } from "@/components/layout/public-nav";

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Server error",
    description:
      "There is a problem with the server configuration. If this keeps happening, contact support.",
  },
  AccessDenied: {
    title: "Access denied",
    description: "You do not have permission to sign in.",
  },
  Verification: {
    title: "Link expired",
    description:
      "This sign-in link has expired or has already been used. Request a new one below.",
  },
};

const DEFAULT_ERROR = {
  title: "Something went wrong",
  description: "An error occurred during sign in. Try again.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error") ?? "";
  const { title, description } = ERROR_MESSAGES[errorCode] ?? DEFAULT_ERROR;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNav />

      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
              <svg
                className="h-7 w-7 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="flex justify-center">
            <Link
              href="/sign-in"
              className="inline-flex items-center rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
