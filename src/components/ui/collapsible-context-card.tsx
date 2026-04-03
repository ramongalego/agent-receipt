"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { highlightJson } from "@/lib/highlight";

type SessionContext = {
  systemPrompt?: string;
  activeRules?: {
    id: string;
    description: string;
    parameters?: Record<string, unknown>;
  }[];
  permissions?: string[];
  environment?: Record<string, unknown>;
};

type CollapsibleContextCardProps = {
  context: SessionContext;
};

export function CollapsibleContextCard({
  context,
}: CollapsibleContextCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h2 className="text-base font-semibold">Decision context</h2>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          <div className="space-y-4">
            {context.systemPrompt && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  System prompt
                </p>
                <div className="max-h-48 overflow-auto rounded-lg border border-border bg-card px-4 py-3 text-sm leading-relaxed">
                  <span className="text-green-700 dark:text-green-300">
                    &ldquo;{context.systemPrompt}&rdquo;
                  </span>
                </div>
              </div>
            )}
            {context.activeRules && context.activeRules.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Active rules
                </p>
                <div className="space-y-2">
                  {context.activeRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="rounded-lg border border-border bg-muted px-4 py-2.5"
                    >
                      <span className="text-xs font-bold text-foreground">
                        {rule.id}
                      </span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {rule.description}
                      </p>
                      {rule.parameters &&
                        Object.keys(rule.parameters).length > 0 && (
                          <pre
                            className="mt-1.5 rounded border border-border bg-card px-3 py-2 font-mono text-xs leading-relaxed"
                            style={{
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                            dangerouslySetInnerHTML={{
                              __html: highlightJson(
                                JSON.stringify(rule.parameters, null, 2),
                              ),
                            }}
                          />
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {context.permissions && context.permissions.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Permissions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {context.permissions.map((perm) => (
                    <Badge key={perm} variant="default">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {context.environment &&
              Object.keys(context.environment).length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Environment
                  </p>
                  <pre
                    className="max-h-32 overflow-auto rounded-lg border border-border bg-card px-4 py-3 font-mono text-xs leading-relaxed"
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: highlightJson(
                        JSON.stringify(context.environment, null, 2),
                      ),
                    }}
                  />
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
