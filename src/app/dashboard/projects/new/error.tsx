"use client";

import { Button } from "@/components/ui/button";

export default function NewProjectError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6">
      <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        We couldn&apos;t load this form
      </h2>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Try again. If it keeps failing, email support@agentreceipt.co.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
