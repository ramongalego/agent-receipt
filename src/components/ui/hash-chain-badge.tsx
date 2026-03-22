"use client";

import { useState } from "react";

type HashChainBadgeProps = {
  valid: boolean;
};

export function HashChainBadge({ valid }: HashChainBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <div
        className={`flex cursor-default items-center gap-2 rounded-lg border px-3 py-2 ${
          valid
            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
            : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
        }`}
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
          className={
            valid
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          {valid ? (
            <polyline points="9 12 12 15 16 10" />
          ) : (
            <line x1="15" y1="9" x2="9" y2="15" />
          )}
        </svg>
        <span
          className={`text-sm font-medium ${
            valid
              ? "text-green-700 dark:text-green-300"
              : "text-red-700 dark:text-red-300"
          }`}
        >
          {valid ? "Hash chain verified" : "Hash chain tampered"}
        </span>
      </div>
      {showTooltip && (
        <div className="absolute left-0 top-full z-10 mt-2 w-72 rounded-lg border border-border bg-zinc-900 p-3 text-xs text-zinc-300 shadow-lg dark:bg-zinc-900">
          {valid
            ? "Every event is hashed with SHA-256 and linked to the previous event's hash. If any event is modified, the chain breaks. All hashes checked out."
            : "One or more event hashes do not match the expected chain. This means event data may have been modified after it was recorded."}
        </div>
      )}
    </div>
  );
}
