"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PlanName } from "@/lib/billing-plans";
import { retryRekorAnchor } from "./actions";

type RekorBadgeProps = {
  rekorStatus: string | null;
  rekorUuid: string | null;
  rekorLogIndex: number | null;
  plan: PlanName;
  sessionId: string;
};

export function RekorBadge({
  rekorStatus,
  rekorUuid,
  rekorLogIndex,
  plan,
  sessionId,
}: RekorBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Free users: no badge
  if (plan === "free") return null;

  // Not yet triggered
  if (rekorStatus === null) return null;

  function handleRetry() {
    startTransition(async () => {
      await retryRekorAnchor(sessionId);
      router.refresh();
    });
  }

  if (rekorStatus === "pending" || isPending) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/30">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-spin text-zinc-400"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Anchoring...
        </span>
      </div>
    );
  }

  if (rekorStatus === "anchored" && rekorUuid) {
    return (
      <div className="relative">
        <a
          href={`https://search.sigstore.dev/?logIndex=${rekorLogIndex}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:hover:bg-green-950/50"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-600 dark:text-green-400"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 12 15 16 10" />
          </svg>
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Anchored on Rekor
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-500 dark:text-green-400"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
        {showTooltip && (
          <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-border bg-zinc-900 p-3 text-xs text-zinc-300 shadow-lg dark:bg-zinc-900">
            An independent public log that proves this receipt existed at this
            time and has not been changed.
          </div>
        )}
      </div>
    );
  }

  if (rekorStatus === "failed") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 dark:border-yellow-800 dark:bg-yellow-950/30">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-yellow-600 dark:text-yellow-400"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
          Anchor failed
        </span>
        <button
          onClick={handleRetry}
          disabled={isPending}
          className="ml-1 rounded px-2 py-0.5 text-xs font-medium text-yellow-700 underline transition-colors hover:text-yellow-900 disabled:opacity-50 dark:text-yellow-300 dark:hover:text-yellow-100"
        >
          Retry
        </button>
      </div>
    );
  }

  return null;
}
