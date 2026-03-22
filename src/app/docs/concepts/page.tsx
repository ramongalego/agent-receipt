import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";

export const metadata: Metadata = {
  title: "Concepts",
};

export default function ConceptsPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight">Concepts</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        The core ideas behind AgentReceipt. Understanding these will help you
        get the most out of the SDK and the dashboard.
      </p>

      {/* Sessions */}
      <h2
        id="sessions"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        Sessions
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        A session is one end-to-end agent run. One invoice processed, one ticket
        handled, one report generated. Sessions group events together into a
        single receipt. Name your sessions clearly. The name shows up in the
        dashboard and in the receipt summary.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        When you use a wrapper like{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          wrapOpenAI
        </code>
        , the SDK creates a session automatically based on the{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          sessionName
        </code>{" "}
        you provide. If you need more control, use{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          startSession
        </code>{" "}
        to manage sessions manually.
      </p>

      <h3 className="mt-8 text-lg font-semibold">Session status</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Each session has a status that is computed automatically:
      </p>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 pr-4 font-semibold">Status</th>
              <th className="pb-2 font-semibold">Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  running
                </span>
              </td>
              <td className="py-2 text-muted-foreground">
                Last event was less than 3 minutes ago.
              </td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4">
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  complete
                </span>
              </td>
              <td className="py-2 text-muted-foreground">
                No new events for 3 minutes and no errors.
              </td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4">
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  error
                </span>
              </td>
              <td className="py-2 text-muted-foreground">
                At least one event with type &quot;error&quot; exists.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="mt-8 text-lg font-semibold">Completing a session</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Sessions complete automatically 3 minutes after the last event. To
        complete a session immediately, call{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          session.end()
        </code>{" "}
        at the end of your agent run. This triggers summary generation and Rekor
        anchoring right away rather than waiting for the timeout.
      </p>
      <CodeBlock
        code={`const session = ar.startSession("Process invoice #441")

try {
  // your agent logic
} finally {
  await session.end() // always call this when your agent finishes
}`}
        filename="session-end.ts"
      />

      <h3 className="mt-8 text-lg font-semibold">Event limit</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Each session can hold up to 200 events. If a session hits 200 events,
        the ingest endpoint stops accepting new events for that session and
        records a system error event. The receipt shows exactly where and why it
        stopped. If your agent runs need more than 200 events, start a new
        session at a logical boundary in your workflow.
      </p>

      {/* Events */}
      <h2
        id="events"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        Events
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        An event is a single action within a session. Every LLM call, tool
        execution, decision, and human review is recorded as an event. Events
        are immutable once written.
      </p>
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 pr-4 font-semibold">Type</th>
              <th className="pb-2 font-semibold">When it fires</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  llm_call
                </code>
              </td>
              <td className="py-2 text-muted-foreground">
                Any LLM completion, streaming or not.
              </td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  tool_call
                </code>
              </td>
              <td className="py-2 text-muted-foreground">
                Any function wrapped with{" "}
                <code className="font-mono">trackTool</code>.
              </td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  decision
                </code>
              </td>
              <td className="py-2 text-muted-foreground">
                Any call to <code className="font-mono">trackDecision</code>.
              </td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  human_review
                </code>
              </td>
              <td className="py-2 text-muted-foreground">
                Any call to <code className="font-mono">trackHumanReview</code>.
              </td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  error
                </code>
              </td>
              <td className="py-2 text-muted-foreground">
                Any error captured by the SDK or recorded by the system.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Each event stores the input, output, duration, and a SHA-256 hash. Raw
        input and output payloads are stored separately in Cloudflare R2, not in
        the main database. This keeps the event metadata small and queryable
        while allowing large payloads.
      </p>

      {/* Receipts */}
      <h2
        id="receipts"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        Receipts
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        A receipt is the human-readable view of a completed session. It shows a
        timeline of every event, a plain-English summary generated by AI, and a
        hash chain verification badge. Receipts are read-only. Nothing can be
        edited after the fact.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        The summary is generated the first time someone views a receipt. It uses
        the event names and types (not the raw payloads) to produce a 3-5
        sentence description of what the agent did. The summary is cached so it
        only needs to be generated once.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        You can see what a receipt looks like on the{" "}
        <a
          href="/demo"
          className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
        >
          demo page
        </a>
        .
      </p>

      <h3 className="mt-8 text-lg font-semibold">Sharing receipts</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Any complete receipt can be shared with a public link. Generate one from
        the Share button on any session detail page. Anyone with the link can
        view the full receipt without signing in. The timeline, summary, hash
        chain status, and Rekor anchor badge are all visible. Links can be
        revoked at any time from the same button. By default, all receipts are
        private.
      </p>

      {/* Hash chain */}
      <h2
        id="hash-chain"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        Hash chain
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Every event stores a SHA-256 hash of its own data combined with the hash
        of the previous event. This creates a chain. If any event is modified
        after the fact, the chain breaks and the dashboard shows
        &quot;Tampered&quot; instead of &quot;Verified&quot;.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        The chain is verified every time someone loads a receipt. The
        verification checks each event&apos;s hash against a freshly computed
        hash of the same data plus the previous event&apos;s hash. If any hash
        does not match, the entire chain is marked as tampered.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        This means even AgentReceipt itself cannot silently modify your data.
        Tampering is always detectable. If you need to prove to an auditor that
        your agent logs have not been altered, the hash chain verification badge
        is that proof.
      </p>
      <div className="mt-6 rounded-lg border border-border bg-muted/50 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          The first event in a session has no previous hash. Its hash is
          computed from its own data only. Every subsequent event&apos;s hash
          depends on the event before it, forming the chain.
        </p>
      </div>

      <h3 className="mt-8 text-lg font-semibold">External verification</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Pro and Business receipts are anchored to the Sigstore Rekor
        transparency log after the session completes. Rekor is a public,
        append-only log run by the Linux Foundation. The anchor proves the
        receipt existed at a specific time and has not been changed since. Click
        the &quot;Anchored on Rekor&quot; badge on any receipt to verify the
        entry independently.
      </p>

      {/* Compliance metadata */}
      <h2
        id="compliance-metadata"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        Compliance metadata
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Any event can be tagged with a compliance object. This lets you flag
        events that contain sensitive data, categorize them, and set custom
        retention periods.
      </p>
      <CodeBlock
        code={`{
  containsPII?: boolean
  dataCategory?: string   // e.g. "health", "financial", "personal"
  retentionOverride?: number  // days
}`}
      />
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Events tagged with{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          containsPII: true
        </code>{" "}
        show a PII badge in the receipt. Your compliance team can filter for
        these events to review what sensitive data your agent handled.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        The{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          retentionOverride
        </code>{" "}
        field sets a custom retention period for that event, overriding the
        project default. Use this for healthcare data (HIPAA requires 6 years)
        or any data with specific retention requirements.
      </p>
      <CodeBlock
        code={`await session.trackTool(
  'fetch-patient-record',
  { patientId: 'P-12345' },
  async () => {
    return await ehr.getPatient('P-12345')
  },
  {
    compliance: {
      containsPII: true,
      dataCategory: 'health',
      retentionOverride: 2190  // 6 years in days
    }
  }
)`}
        filename="compliance-example.ts"
      />
    </article>
  );
}
