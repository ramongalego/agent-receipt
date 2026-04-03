"use client";

import { useState, useCallback } from "react";

type TestStatus = "idle" | "running" | "success" | "error";

type TestResult = {
  status: TestStatus;
  output?: unknown;
  error?: string;
};

type TestDef = {
  id: string;
  label: string;
  provider: string;
  method: string;
};

const PROVIDERS: { name: string; tests: TestDef[] }[] = [
  {
    name: "OpenAI",
    tests: [
      {
        id: "openai-standard",
        label: "chat.completions.create",
        provider: "openai",
        method: "standard",
      },
      {
        id: "openai-streaming",
        label: "chat.completions.create (streaming)",
        provider: "openai",
        method: "streaming",
      },
      {
        id: "openai-tool-calling",
        label: "chat.completions.create (tool calling)",
        provider: "openai",
        method: "tool-calling",
      },
      {
        id: "openai-structured",
        label: "chat.completions.create (structured output)",
        provider: "openai",
        method: "structured-output",
      },
    ],
  },
  {
    name: "Anthropic",
    tests: [
      {
        id: "anthropic-standard",
        label: "messages.create",
        provider: "anthropic",
        method: "standard",
      },
      {
        id: "anthropic-streaming",
        label: "messages.stream (streaming)",
        provider: "anthropic",
        method: "streaming",
      },
      {
        id: "anthropic-tool-calling",
        label: "messages.create (tool calling)",
        provider: "anthropic",
        method: "tool-calling",
      },
      {
        id: "anthropic-structured",
        label: "messages.create (structured output)",
        provider: "anthropic",
        method: "structured-output",
      },
    ],
  },
  {
    name: "Gemini",
    tests: [
      {
        id: "gemini-standard",
        label: "models.generateContent",
        provider: "gemini",
        method: "standard",
      },
      {
        id: "gemini-streaming",
        label: "models.generateContentStream",
        provider: "gemini",
        method: "streaming",
      },
      {
        id: "gemini-tool-calling",
        label: "models.generateContent (tool calling)",
        provider: "gemini",
        method: "tool-calling",
      },
    ],
  },
  {
    name: "Mistral",
    tests: [
      {
        id: "mistral-standard",
        label: "chat.complete",
        provider: "mistral",
        method: "standard",
      },
      {
        id: "mistral-streaming",
        label: "chat.stream (streaming)",
        provider: "mistral",
        method: "streaming",
      },
      {
        id: "mistral-tool-calling",
        label: "chat.complete (tool calling)",
        provider: "mistral",
        method: "tool-calling",
      },
      {
        id: "mistral-structured",
        label: "chat.complete (structured output)",
        provider: "mistral",
        method: "structured-output",
      },
    ],
  },
  {
    name: "Vercel AI SDK",
    tests: [
      {
        id: "vercelai-standard",
        label: "generateText",
        provider: "vercel-ai",
        method: "standard",
      },
      {
        id: "vercelai-streaming",
        label: "streamText",
        provider: "vercel-ai",
        method: "streaming",
      },
      {
        id: "vercelai-structured",
        label: "generateObject (structured output)",
        provider: "vercel-ai",
        method: "structured-output",
      },
      {
        id: "vercelai-streaming-structured",
        label: "streamObject (streaming structured)",
        provider: "vercel-ai",
        method: "streaming-structured-output",
      },
    ],
  },
  {
    name: "AgentReceipt Features",
    tests: [
      {
        id: "features-human-review",
        label: "trackHumanReview (approved)",
        provider: "features",
        method: "human-review",
      },
      {
        id: "features-human-review-rejected",
        label: "trackHumanReview (rejected with notes)",
        provider: "features",
        method: "human-review-rejected",
      },
      {
        id: "features-pii-compliance",
        label: "trackTool with PII compliance metadata",
        provider: "features",
        method: "pii-compliance",
      },
      {
        id: "features-explicit-end",
        label: "Explicit session.end() (immediate completion)",
        provider: "features",
        method: "explicit-end",
      },
      {
        id: "features-decision-context",
        label: "Session + event decision context (invoice flow)",
        provider: "features",
        method: "decision-context",
      },
      {
        id: "features-context-change",
        label: "Mid-session context change (threshold update)",
        provider: "features",
        method: "context-change",
      },
      {
        id: "features-combined",
        label: "Full session: tool + human review + PII",
        provider: "features",
        method: "combined",
      },
    ],
  },
];

export default function TestPanel() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [runningAll, setRunningAll] = useState(false);

  const runTest = useCallback(async (test: TestDef) => {
    setResults((prev) => ({
      ...prev,
      [test.id]: { status: "running" },
    }));

    try {
      const res = await fetch(`/api/test/${test.provider}/${test.method}`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setResults((prev) => ({
          ...prev,
          [test.id]: { status: "success", output: data.output },
        }));
      } else {
        setResults((prev) => ({
          ...prev,
          [test.id]: { status: "error", error: data.error },
        }));
      }
    } catch (e) {
      setResults((prev) => ({
        ...prev,
        [test.id]: {
          status: "error",
          error: e instanceof Error ? e.message : "Request failed",
        },
      }));
    }
  }, []);

  async function runAll() {
    setRunningAll(true);
    const allTests = PROVIDERS.flatMap((p) => p.tests);
    for (const test of allTests) {
      await runTest(test);
    }
    setRunningAll(false);
  }

  const allTests = PROVIDERS.flatMap((p) => p.tests);
  const successCount = allTests.filter(
    (t) => results[t.id]?.status === "success",
  ).length;
  const errorCount = allTests.filter(
    (t) => results[t.id]?.status === "error",
  ).length;
  const totalRun = successCount + errorCount;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 40,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            TestLord
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#71717a",
              marginTop: 4,
              marginBottom: 0,
            }}
          >
            AgentReceipt SDK wrapper test harness
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {totalRun > 0 && (
            <span style={{ fontSize: 13, color: "#71717a" }}>
              {successCount}/{allTests.length} passed
              {errorCount > 0 && (
                <span style={{ color: "#ef4444" }}> ({errorCount} failed)</span>
              )}
            </span>
          )}
          <button
            onClick={runAll}
            disabled={runningAll}
            style={{
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 600,
              color: "#0a0a0f",
              backgroundColor: "#e4e4e7",
              border: "none",
              borderRadius: 8,
              cursor: runningAll ? "not-allowed" : "pointer",
              opacity: runningAll ? 0.5 : 1,
            }}
          >
            {runningAll ? "Running..." : "Run all"}
          </button>
        </div>
      </div>

      {PROVIDERS.map((provider) => (
        <section key={provider.name} style={{ marginBottom: 40 }}>
          <h2
            style={{
              fontWeight: 600,
              marginBottom: 12,
              color: "#a1a1aa",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontSize: 12,
            }}
          >
            {provider.name}
          </h2>
          <div
            style={{
              border: "1px solid #27272a",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {provider.tests.map((test, i) => {
              const result = results[test.id] ?? { status: "idle" as const };
              return (
                <div
                  key={test.id}
                  style={{
                    borderTop: i > 0 ? "1px solid #27272a" : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <StatusDot status={result.status} />
                      <span
                        style={{
                          fontSize: 13,
                          fontFamily: "monospace",
                          color: "#d4d4d8",
                        }}
                      >
                        {test.label}
                      </span>
                    </div>
                    <button
                      onClick={() => runTest(test)}
                      disabled={result.status === "running"}
                      style={{
                        padding: "4px 14px",
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#d4d4d8",
                        backgroundColor: "transparent",
                        border: "1px solid #3f3f46",
                        borderRadius: 6,
                        cursor:
                          result.status === "running"
                            ? "not-allowed"
                            : "pointer",
                        opacity: result.status === "running" ? 0.5 : 1,
                      }}
                    >
                      {result.status === "running" ? "Running..." : "Run"}
                    </button>
                  </div>
                  {result.status !== "idle" && result.status !== "running" && (
                    <div
                      style={{
                        padding: "8px 16px 12px 16px",
                        borderTop: "1px solid #1e1e22",
                        backgroundColor: "#111114",
                      }}
                    >
                      {result.status === "error" ? (
                        <pre
                          style={{
                            margin: 0,
                            fontSize: 12,
                            fontFamily: "monospace",
                            color: "#ef4444",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {result.error}
                        </pre>
                      ) : (
                        <pre
                          style={{
                            margin: 0,
                            fontSize: 12,
                            fontFamily: "monospace",
                            color: "#86efac",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {typeof result.output === "string"
                            ? result.output
                            : JSON.stringify(result.output, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function StatusDot({ status }: { status: TestStatus }) {
  const colors: Record<TestStatus, string> = {
    idle: "#3f3f46",
    running: "#fbbf24",
    success: "#22c55e",
    error: "#ef4444",
  };
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: colors[status],
        ...(status === "running"
          ? { animation: "pulse 1.5s ease-in-out infinite" }
          : {}),
      }}
    />
  );
}
