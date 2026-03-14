"use client";

import { Button } from "@/components/ui/button";

export default function ProjectSettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6">
      <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Something went wrong
      </h2>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        {error.message || "Could not load project settings. Please try again."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
