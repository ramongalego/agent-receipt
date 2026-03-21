"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { createApiKeyAction, revokeApiKeyAction } from "../../actions";

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revoked: boolean;
};

type ApiKeysSectionProps = {
  projectId: string;
  initialKeys: ApiKey[];
  isOwner?: boolean;
};

export function ApiKeysSection({
  projectId,
  initialKeys,
  isOwner = true,
}: ApiKeysSectionProps) {
  const router = useRouter();
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, startCreate] = useTransition();
  const [optimisticRevoked, setOptimisticRevoked] = useState<Set<string>>(
    new Set(),
  );
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  function handleCreate() {
    startCreate(async () => {
      const result = await createApiKeyAction(projectId, "Default key");
      if (result.error) {
        toast.error(result.error);
      } else if (result.key) {
        setNewKey(result.key);
        toast.success("API key created.");
        router.refresh();
      }
    });
  }

  function handleRevoke(keyId: string) {
    setConfirmRevokeId(null);
    setOptimisticRevoked((prev) => new Set(prev).add(keyId));
    revokeApiKeyAction(keyId, projectId).then((result) => {
      if (result.error) {
        toast.error(result.error);
        setOptimisticRevoked((prev) => {
          const next = new Set(prev);
          next.delete(keyId);
          return next;
        });
      } else {
        toast.info("API key revoked.");
      }
      router.refresh();
    });
  }

  const keys = initialKeys.map((k) => ({
    ...k,
    revoked: k.revoked || optimisticRevoked.has(k.id),
  }));
  const activeKeys = keys.filter((k) => !k.revoked);
  const revokedKeys = keys.filter((k) => k.revoked);

  return (
    <div>
      {/* New key banner */}
      {newKey && (
        <div className="mb-4 rounded-xl border border-yellow-300 bg-yellow-50 p-5 dark:border-yellow-800 dark:bg-yellow-950/30">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-full bg-yellow-200 p-1.5 dark:bg-yellow-900/60">
              <svg
                className="h-4 w-4 text-yellow-700 dark:text-yellow-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Copy your API key now. It will not be shown again.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="rounded-md bg-yellow-100 px-3 py-1.5 font-mono text-xs text-yellow-900 dark:bg-yellow-900/50 dark:text-yellow-100">
                  {newKey}
                </code>
                <CopyButton text={newKey} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewKey(null)}
                className="mt-3"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeKeys.length === 0 && !newKey ? (
        <EmptyState
          title="No API keys"
          description={
            isOwner
              ? "Create an API key to connect your agent's SDK to this project."
              : "No API keys have been created yet. Ask a workspace owner to create one."
          }
          action={
            isOwner ? (
              <Button onClick={handleCreate} loading={creating}>
                Create API key
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {isOwner && (
            <div className="mb-4 flex justify-start">
              <Button onClick={handleCreate} loading={creating} size="sm">
                Create API key
              </Button>
            </div>
          )}
          <Card>
            <div className="divide-y divide-border">
              {activeKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div>
                    <code className="rounded bg-muted px-2 py-1 font-mono text-sm text-foreground">
                      {key.keyPrefix}
                    </code>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Created{" "}
                      {new Date(key.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {key.lastUsedAt &&
                        ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                    </p>
                  </div>
                  {isOwner && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setConfirmRevokeId(key.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
              {revokedKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between px-6 py-4 opacity-40"
                >
                  <div>
                    <code className="rounded bg-muted px-2 py-1 font-mono text-sm text-muted-foreground line-through">
                      {key.keyPrefix}
                    </code>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Revoked
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <ConfirmModal
        open={confirmRevokeId !== null}
        title="Revoke this API key?"
        description="Any SDK using this key will stop working. This cannot be undone."
        confirmLabel="Revoke key"
        variant="danger"
        onConfirm={() => confirmRevokeId && handleRevoke(confirmRevokeId)}
        onCancel={() => setConfirmRevokeId(null)}
      />
    </div>
  );
}
