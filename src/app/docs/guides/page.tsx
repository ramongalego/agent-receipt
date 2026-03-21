import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";

export const metadata: Metadata = {
  title: "Guides",
};

export default function GuidesPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight">Guides</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Step-by-step walkthroughs for common integration patterns. Each guide
        includes real, runnable code.
      </p>

      {/* OpenAI agents */}
      <h2
        id="openai-agents"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        OpenAI agents
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        This example shows a complete agent that processes a document, calls a
        tool, makes a decision, and ends the session. Every action is captured
        by AgentReceipt.
      </p>
      <CodeBlock
        code={`import OpenAI from 'openai'
import { createClient } from '@agentreceipt/sdk'

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY })
const openai = ar.wrapOpenAI(new OpenAI(), {
  sessionName: 'Process invoice #441'
})
const session = ar.startSession('Process invoice #441')

// Step 1: Parse the invoice with an LLM call
const parseResult = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{
    role: 'user',
    content: 'Extract structured data from this invoice: Invoice #441, Acme Corp, $4,500'
  }]
})

const invoice = JSON.parse(parseResult.choices[0].message.content)

// Step 2: Look up the vendor in the database
const vendor = await session.trackTool(
  'look-up-vendor',
  { vendorName: invoice.vendor },
  async () => {
    return await db.vendors.findByName(invoice.vendor)
  }
)

// Step 3: Decide whether to approve the payment
const withinLimit = invoice.amount <= vendor.autoApprovalLimit
await session.trackDecision(
  'approve-payment',
  \`Amount $\${invoice.amount} is \${withinLimit ? 'within' : 'above'} the $\${vendor.autoApprovalLimit} limit\`,
  withinLimit ? 'approved' : 'requires-review'
)

// Step 4: Trigger the payment if approved
if (withinLimit) {
  await session.trackTool(
    'trigger-payment',
    { vendorId: vendor.id, amount: invoice.amount },
    async () => {
      return await payments.create({
        to: vendor.bankAccount,
        amount: invoice.amount,
        reference: \`INV-\${invoice.number}\`
      })
    }
  )
}

await session.end()`}
        filename="openai-agent.ts"
      />

      {/* Anthropic agents */}
      <h2
        id="anthropic-agents"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        Anthropic agents
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Same pattern as OpenAI, but using the Anthropic SDK. This example shows
        tool use with{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          trackTool
        </code>{" "}
        alongside LLM calls.
      </p>
      <CodeBlock
        code={`import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@agentreceipt/sdk'

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY })
const anthropic = ar.wrapAnthropic(new Anthropic(), {
  sessionName: 'Classify support ticket #892'
})
const session = ar.startSession('Classify support ticket #892')

// Step 1: Classify the ticket
const classification = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 256,
  messages: [{
    role: 'user',
    content: 'Classify this support ticket: "My payment failed twice this morning"'
  }]
})

// Step 2: Look up the customer
const customer = await session.trackTool(
  'look-up-customer',
  { ticketId: 892 },
  async () => {
    return await db.customers.findByTicket(892)
  }
)

// Step 3: Route to the right team
await session.trackDecision(
  'route-ticket',
  'Ticket is about payments. Customer is on the Pro plan. Routing to billing team.',
  'routed-to-billing'
)

await session.end()`}
        filename="anthropic-agent.ts"
      />

      {/* Vercel AI SDK agents */}
      <h2
        id="vercel-ai-sdk-agents"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        Vercel AI SDK agents
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        When using the Vercel AI SDK, wrap the functions you use with{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          wrapVercelAI
        </code>
        . You can combine this with{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          startSession
        </code>{" "}
        for manual tracking of tool calls and decisions.
      </p>
      <CodeBlock
        code={`import { generateText, generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@agentreceipt/sdk'

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY })
const ai = ar.wrapVercelAI({ generateText, generateObject }, {
  sessionName: 'Generate quarterly report'
})
const session = ar.startSession('Generate quarterly report')

// Step 1: Extract structured data from a document
const { object: metrics } = await ai.generateObject({
  model: openai('gpt-4o'),
  schema: z.object({
    revenue: z.number(),
    expenses: z.number(),
    headcount: z.number()
  }),
  prompt: 'Extract Q1 metrics from this financial summary: ...'
})

// Step 2: Generate a text summary
const { text: summary } = await ai.generateText({
  model: openai('gpt-4o'),
  prompt: \`Write a 3-paragraph summary of these Q1 metrics: \${JSON.stringify(metrics)}\`
})

// Step 3: Save the report
await session.trackTool(
  'save-report',
  { quarter: 'Q1', metrics },
  async () => {
    return await db.reports.create({ quarter: 'Q1', summary, metrics })
  }
)

await session.end()`}
        filename="vercel-ai-agent.ts"
      />

      {/* Approval workflows */}
      <h2
        id="approval-workflows"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        Approval workflows
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        This pattern covers the full approval flow: an agent proposes an action,
        a human reviews it, and the agent proceeds or stops based on the
        decision. Both the approved and rejected paths are shown.
      </p>
      <CodeBlock
        code={`import { createClient } from '@agentreceipt/sdk'

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY })
const session = ar.startSession('Wire transfer to vendor')

// Step 1: Agent proposes a payment
const proposal = await session.trackTool(
  'prepare-payment',
  { vendor: 'Acme Corp', amount: 25000, currency: 'USD' },
  async () => {
    return {
      vendor: 'Acme Corp',
      amount: 25000,
      currency: 'USD',
      bankAccount: '****7890',
      reason: 'Q1 consulting invoice'
    }
  }
)

// Step 2: Agent decides this needs human review (amount exceeds auto-approval)
await session.trackDecision(
  'requires-approval',
  'Amount $25,000 exceeds $5,000 auto-approval limit.',
  'escalated-to-human'
)

// Step 3: Wait for human review (your app handles this, e.g. via a queue or webhook)
const reviewResult = await waitForHumanApproval(proposal)

// Step 4: Record the human review
await session.trackHumanReview({
  reviewer: reviewResult.reviewerEmail,
  decision: reviewResult.approved ? 'approved' : 'rejected',
  notes: reviewResult.notes
})

// Step 5: Proceed or stop based on the decision
if (reviewResult.approved) {
  await session.trackTool(
    'execute-payment',
    { paymentId: proposal.id },
    async () => {
      return await payments.execute(proposal.id)
    }
  )
} else {
  await session.trackDecision(
    'payment-cancelled',
    \`Rejected by \${reviewResult.reviewerEmail}: \${reviewResult.notes}\`,
    'cancelled'
  )
}

await session.end()`}
        filename="approval-workflow.ts"
      />
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        The receipt for this session will show the full chain: the agent
        prepared a payment, decided it needed human review, a specific person
        approved or rejected it, and the agent acted on that decision. This is
        exactly the kind of audit trail that compliance teams need.
      </p>

      {/* Handling errors */}
      <h2
        id="handling-errors"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        Handling errors
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        The SDK is designed to never break your agent. If something goes wrong
        with AgentReceipt, your agent keeps running.
      </p>

      <h3 className="mt-8 text-lg font-semibold">
        What happens when the SDK cannot reach AgentReceipt
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        If the ingest endpoint is unreachable (network error, timeout, server
        down), the SDK logs a warning to the console and continues. Your agent
        code runs exactly as it would without the SDK. Events that could not be
        sent are dropped silently. They are not retried or queued to disk.
      </p>

      <h3 className="mt-8 text-lg font-semibold">Verifying your integration</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        After wrapping your client, run your agent once and check the dashboard.
        You should see a new session with events. If you do not see anything:
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
        <li>Check that your API key is correct and not revoked.</li>
        <li>
          Check that the key belongs to the right project. API keys are scoped
          to a single project.
        </li>
        <li>
          Check your console for warnings from the SDK. They will start with{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            [agentreceipt]
          </code>
          .
        </li>
        <li>
          Make sure your agent is actually making LLM calls. If the wrapped
          client is never used, no events are generated.
        </li>
      </ul>

      <h3 className="mt-8 text-lg font-semibold">
        What the session looks like when an agent errors mid-run
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        If your agent throws an error during a{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          trackTool
        </code>{" "}
        call, the SDK records the error as an event (type{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          error
        </code>
        ) and then re-throws it. The session status changes to
        &quot;error&quot;. The receipt shows all events up to and including the
        error, so you can see exactly what happened before things went wrong.
      </p>
      <CodeBlock
        code={`// If the wrapped function throws, the error is captured and re-thrown
try {
  await session.trackTool('send-email', { to: 'user@example.com' }, async () => {
    // This throws an error
    throw new Error('SMTP connection refused')
  })
} catch (err) {
  // The error is re-thrown here
  // But the SDK has already recorded it as an error event
  console.error('Email failed:', err.message)
}

// The session now has status "error"
// The receipt shows the error event with the full error message`}
        filename="error-handling.ts"
      />
    </article>
  );
}
