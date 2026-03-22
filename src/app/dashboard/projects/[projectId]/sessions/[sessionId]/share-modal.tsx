"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { generateShareLink, revokeShareLink } from "./actions";

type ShareModalProps = {
  sessionId: string;
  existingToken: string | null;
  existingTokenCreatedAt: Date | null;
};

export function ShareButton({
  sessionId,
  existingToken,
  existingTokenCreatedAt,
}: ShareModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          existingToken
            ? "flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300 dark:hover:bg-green-950/50"
            : "flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        }
      >
        {existingToken ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        )}
        {existingToken ? "Shared" : "Share"}
      </button>
      {open && (
        <ShareModal
          sessionId={sessionId}
          existingToken={existingToken}
          existingTokenCreatedAt={existingTokenCreatedAt}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ShareModal({
  sessionId,
  existingToken,
  existingTokenCreatedAt,
  onClose,
}: ShareModalProps & { onClose: () => void }) {
  const router = useRouter();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://agentreceipt.co";
  const [token, setToken] = useState(existingToken);
  const [tokenCreatedAt, setTokenCreatedAt] = useState(existingTokenCreatedAt);
  const [copied, setCopied] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [generating, startGenerate] = useTransition();
  const [revoking, startRevoke] = useTransition();

  const shareUrl = token ? `${appUrl}/s/${token}` : null;

  function handleGenerate() {
    startGenerate(async () => {
      const result = await generateShareLink(sessionId);
      if ("token" in result) {
        setToken(result.token);
        setTokenCreatedAt(new Date());
        router.refresh();
      }
    });
  }

  function handleRevoke() {
    startRevoke(async () => {
      const result = await revokeShareLink(sessionId);
      if ("success" in result) {
        setToken(null);
        setTokenCreatedAt(null);
        setConfirmRevoke(false);
        router.refresh();
      }
    });
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card px-6 pb-6 pt-5 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h2 className="mb-2 text-lg font-semibold">Share this receipt</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Anyone with this link can view this receipt without signing in.
        </p>

        {!token ? (
          <Button
            variant="primary"
            size="md"
            onClick={handleGenerate}
            loading={generating}
          >
            Generate link
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center rounded-lg border border-border bg-muted">
              <span className="flex-1 truncate px-3 py-2 font-mono text-xs text-foreground">
                {shareUrl}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 border-l border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="flex items-center justify-between">
              {tokenCreatedAt && (
                <p className="text-xs text-muted-foreground">
                  Created{" "}
                  {new Date(tokenCreatedAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  at{" "}
                  {new Date(tokenCreatedAt).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
              <a
                href={shareUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View shared receipt
              </a>
            </div>

            <div className="border-t border-border" />

            {!confirmRevoke ? (
              <button
                type="button"
                onClick={() => setConfirmRevoke(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Revoke link
              </button>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                <p className="mb-3 text-xs text-red-700 dark:text-red-300">
                  Revoke this link? Anyone with the current link will lose
                  access.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleRevoke}
                    loading={revoking}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmRevoke(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
