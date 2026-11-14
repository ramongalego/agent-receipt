"use client";

import { Button } from "@/components/ui/button";

export default function BillingError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        We couldn&apos;t load billing
      </h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Try again. If it keeps failing, email support@agentreceipt.co.
      </p>
      <Button onClick={reset} variant="secondary" className="mt-4">
        Try again
      </Button>
    </div>
  );
}
