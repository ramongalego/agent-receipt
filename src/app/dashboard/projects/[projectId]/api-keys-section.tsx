"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
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
};

export function ApiKeysSection({
  projectId,
  initialKeys,
}: ApiKeysSectionProps) {
  const router = useRouter();
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, startCreate] = useTransition();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  function handleCreate() {
    startCreate(async () => {
      const result = await createApiKeyAction(projectId, "Default key");
      if (result.key) {
        setNewKey(result.key);
        router.refresh();
      }
    });
  }

  function handleRevoke(keyId: string) {
    if (!confirm("Revoke this API key? Any SDK using it will stop working.")) {
      return;
    }
    setRevokingId(keyId);
    revokeApiKeyAction(keyId, projectId).then(() => {
      setRevokingId(null);
      router.refresh();
    });
  }

  const activeKeys = initialKeys.filter((k) => !k.revoked);
  const revokedKeys = initialKeys.filter((k) => k.revoked);

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
          description="Create an API key to connect your agent's SDK to this project."
          action={
            <Button onClick={handleCreate} loading={creating}>
              Create API key
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex justify-start">
            <Button onClick={handleCreate} loading={creating} size="sm">
              Create API key
            </Button>
          </div>
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
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRevoke(key.id)}
                    loading={revokingId === key.id}
                  >
                    Revoke
                  </Button>
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
    </div>
  );
}
