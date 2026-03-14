"use client";

import { Button } from "@/components/ui/button";

export default function SessionsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Failed to load sessions
      </h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {error.message || "Something went wrong. Try again."}
      </p>
      <Button onClick={reset} variant="secondary" className="mt-4">
        Try again
      </Button>
    </div>
  );
}
