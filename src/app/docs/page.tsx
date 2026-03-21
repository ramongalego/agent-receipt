import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";

export const metadata: Metadata = {
  title: "Documentation · AgentReceipt",
  description:
    "Learn how to integrate AgentReceipt into your AI agent. Get started in five minutes.",
};

export default function DocsPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Everything you need to capture, store, and verify AI agent actions.
      </p>

      {/* Overview */}
      <h2
        id="overview"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        Overview
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        AgentReceipt captures every action your AI agent takes and stores it as
        a tamper-proof, human-readable receipt. If your agent sends emails,
        triggers payments, or modifies data, AgentReceipt gives you a clear
        record of what happened, when, and why. It is built for developers who
        build agents and for compliance teams who need to audit them.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        The output is a receipt: a timeline of every LLM call, tool call, and
        decision your agent made during a single run. Each event is
        hash-chained, so any tampering is immediately detectable. You can view
        receipts in the dashboard, share them with auditors, or use them as
        evidence that your agent followed the rules.
      </p>

      {/* Quick start */}
      <h2
        id="quick-start"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        Quick start
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        The fastest path from zero to your first receipt.
      </p>

      <h3 className="mt-8 text-lg font-semibold">Step 1: Install the SDK</h3>
      <CodeBlock code="npm install @agentreceipt/sdk" language="bash" />

      <h3 className="mt-8 text-lg font-semibold">
        Step 2: Get an API key from the dashboard
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        <Link
          href="/sign-in"
          className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
        >
          Sign in
        </Link>{" "}
        and create a project. On the project page, click &quot;Create API
        key&quot;. Copy the key. You will not see it again.
      </p>

      <h3 className="mt-8 text-lg font-semibold">
        Step 3: Wrap your AI client
      </h3>
      <CodeBlock
        code={`import OpenAI from 'openai'
import { createClient } from '@agentreceipt/sdk'

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY })
const openai = ar.wrapOpenAI(new OpenAI(), { sessionName: 'Process invoice #441' })

// Use openai exactly as before
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Parse this invoice.' }]
})`}
        filename="agent.ts"
      />

      <h3 className="mt-8 text-lg font-semibold">
        Step 4: View the receipt in the dashboard
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Open the{" "}
        <Link
          href="/dashboard"
          className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
        >
          dashboard
        </Link>
        , go to your project, and click into the session. You will see a
        timeline of every action your agent took, along with a plain-English
        summary and a hash chain verification badge.
      </p>
      <div className="mt-6 rounded-lg border border-border bg-muted/50 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          That is it. Every LLM call, tool call, and decision is now captured
          automatically.
        </p>
      </div>

      {/* How it works */}
      <h2
        id="how-it-works"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        How it works
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        The SDK wraps your AI client and intercepts every call. Your code does
        not change. You call{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          openai.chat.completions.create()
        </code>{" "}
        exactly as before. The wrapper captures the input, output, duration, and
        model name, then sends it to AgentReceipt in the background.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Each intercepted call is sent to AgentReceipt as an event. Events are
        grouped into sessions. A session represents one end-to-end agent run,
        like processing a single invoice or handling a single support ticket.
        The SDK batches events and sends them every 2 seconds or when 10 events
        are queued, whichever comes first.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Events are stored in an append-only database and hash-chained. Each
        event&apos;s hash includes the previous event&apos;s hash, creating an
        unbreakable chain. If any event is modified after the fact, the chain
        breaks. The dashboard renders this data as a human-readable receipt that
        anyone can read, including people who are not technical.
      </p>
    </article>
  );
}
