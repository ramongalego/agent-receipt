import type { Metadata } from "next";
import { CodeBlock } from "@/components/docs/code-block";

export const metadata: Metadata = {
  title: "SDK Reference",
};

export default function SdkReferencePage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight">SDK Reference</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        The TypeScript SDK for capturing AI agent actions. Install it, wrap your
        client, and every action is recorded automatically.
      </p>

      {/* Installation */}
      <h2
        id="installation"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        Installation
      </h2>
      <CodeBlock code="npm install @agentreceipt/sdk" language="bash" />
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Set the{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          AGENTRECEIPT_API_KEY
        </code>{" "}
        environment variable or pass the key directly to{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          createClient
        </code>
        .
      </p>

      {/* createClient */}
      <h2
        id="createclient"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        createClient(options)
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Creates an AgentReceipt client instance. This is the entry point for all
        SDK functionality.
      </p>
      <CodeBlock
        code={`function createClient(options: {
  apiKey: string
  baseUrl?: string  // defaults to https://agentreceipt.io
}): AgentReceiptClient`}
      />
      <ParamTable
        params={[
          {
            name: "apiKey",
            type: "string",
            required: true,
            description:
              "Your project API key. Starts with ar_live_ or ar_test_.",
          },
          {
            name: "baseUrl",
            type: "string",
            required: false,
            description:
              "Override the API endpoint. Defaults to https://agentreceipt.io.",
          },
        ]}
      />
      <CodeBlock
        code={`import { createClient } from '@agentreceipt/sdk'

const ar = createClient({
  apiKey: process.env.AGENTRECEIPT_API_KEY
})`}
        filename="agent.ts"
      />

      {/* wrapOpenAI */}
      <h2
        id="wrapopenai"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        wrapOpenAI(client, options?)
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Wraps an OpenAI client. Every{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          chat.completions.create
        </code>{" "}
        call is intercepted, including streaming and tool calls.
      </p>
      <CodeBlock
        code={`function wrapOpenAI<T>(client: T, options?: {
  sessionName?: string
}): T`}
      />
      <ParamTable
        params={[
          {
            name: "client",
            type: "OpenAI",
            required: true,
            description: "An OpenAI client instance.",
          },
          {
            name: "options.sessionName",
            type: "string",
            required: false,
            description:
              'Human-readable session label. Shows up in the dashboard, e.g. "Process invoice #441".',
          },
        ]}
      />
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Returns the original OpenAI client with all methods intact. Streaming
        responses are buffered and sent as a single event. Tool calls are
        captured with their arguments and results.
      </p>
      <CodeBlock
        code={`import OpenAI from 'openai'
import { createClient } from '@agentreceipt/sdk'

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY })
const openai = ar.wrapOpenAI(new OpenAI(), {
  sessionName: 'Process invoice #441'
})

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Parse this invoice.' }]
})`}
        filename="openai-example.ts"
      />

      {/* wrapAnthropic */}
      <h2
        id="wrapanthropic"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        wrapAnthropic(client, options?)
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Wraps an Anthropic client. Covers{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          messages.create
        </code>{" "}
        and{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          messages.stream
        </code>
        . Tool use and structured output are captured.
      </p>
      <CodeBlock
        code={`function wrapAnthropic<T>(client: T, options?: {
  sessionName?: string
}): T`}
      />
      <ParamTable
        params={[
          {
            name: "client",
            type: "Anthropic",
            required: true,
            description: "An Anthropic client instance.",
          },
          {
            name: "options.sessionName",
            type: "string",
            required: false,
            description: "Human-readable session label.",
          },
        ]}
      />
      <CodeBlock
        code={`import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@agentreceipt/sdk'

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY })
const anthropic = ar.wrapAnthropic(new Anthropic(), {
  sessionName: 'Classify support ticket'
})

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Classify this ticket.' }]
})`}
        filename="anthropic-example.ts"
      />

      {/* wrapGemini */}
      <h2
        id="wrapgemini"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        wrapGemini(client, options?)
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Wraps a Google Generative AI client. Covers{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          models.generateContent
        </code>{" "}
        and{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          models.generateContentStream
        </code>
        .
      </p>
      <CodeBlock
        code={`function wrapGemini<T>(client: T, options?: {
  sessionName?: string
}): T`}
      />
      <ParamTable
        params={[
          {
            name: "client",
            type: "GoogleGenAI",
            required: true,
            description: "A Google Generative AI client instance.",
          },
          {
            name: "options.sessionName",
            type: "string",
            required: false,
            description: "Human-readable session label.",
          },
        ]}
      />
      <CodeBlock
        code={`import { GoogleGenAI } from '@google/genai'
import { createClient } from '@agentreceipt/sdk'

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY })
const gemini = ar.wrapGemini(new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }), {
  sessionName: 'Summarize document'
})

const response = await gemini.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: 'Summarize this document.'
})`}
        filename="gemini-example.ts"
      />

      {/* wrapMistral */}
      <h2
        id="wrapmistral"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        wrapMistral(client, options?)
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Wraps a Mistral client. Covers{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          chat.complete
        </code>{" "}
        and{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          chat.stream
        </code>
        .
      </p>
      <CodeBlock
        code={`function wrapMistral<T>(client: T, options?: {
  sessionName?: string
}): T`}
      />
      <ParamTable
        params={[
          {
            name: "client",
            type: "Mistral",
            required: true,
            description: "A Mistral client instance.",
          },
          {
            name: "options.sessionName",
            type: "string",
            required: false,
            description: "Human-readable session label.",
          },
        ]}
      />
      <CodeBlock
        code={`import { Mistral } from '@mistralai/mistralai'
import { createClient } from '@agentreceipt/sdk'

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY })
const mistral = ar.wrapMistral(new Mistral({ apiKey: process.env.MISTRAL_API_KEY }), {
  sessionName: 'Extract entities'
})

const response = await mistral.chat.complete({
  model: 'mistral-large-latest',
  messages: [{ role: 'user', content: 'Extract entities from this text.' }]
})`}
        filename="mistral-example.ts"
      />

      {/* wrapVercelAI */}
      <h2
        id="wrapvercelai"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        wrapVercelAI(functions, options?)
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Wraps Vercel AI SDK functions. Pass in the functions you use and get
        back wrapped versions that capture every call.
      </p>
      <CodeBlock
        code={`function wrapVercelAI(functions: {
  generateText?: typeof generateText
  streamText?: typeof streamText
  generateObject?: typeof generateObject
  streamObject?: typeof streamObject
}, options?: {
  sessionName?: string
}): typeof functions`}
      />
      <ParamTable
        params={[
          {
            name: "functions",
            type: "object",
            required: true,
            description:
              "An object containing the Vercel AI SDK functions you want to wrap.",
          },
          {
            name: "options.sessionName",
            type: "string",
            required: false,
            description: "Human-readable session label.",
          },
        ]}
      />
      <CodeBlock
        code={`import { generateText, generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@agentreceipt/sdk'

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY })
const ai = ar.wrapVercelAI({ generateText, generateObject }, {
  sessionName: 'Generate report'
})

const { text } = await ai.generateText({
  model: openai('gpt-4o'),
  prompt: 'Write a summary of this quarter.'
})`}
        filename="vercel-ai-example.ts"
      />

      {/* startSession */}
      <h2
        id="startsession"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        startSession(name?)
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Creates a session manually. Use this when you need to track tool calls
        or decisions that happen outside of an LLM call, or when you want
        explicit control over session boundaries.
      </p>
      <CodeBlock code={`function startSession(name?: string): Session`} />
      <ParamTable
        params={[
          {
            name: "name",
            type: "string",
            required: false,
            description:
              'A human-readable name for this session. Shows up in the dashboard, e.g. "Process invoice #441".',
          },
        ]}
      />
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        The returned{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          Session
        </code>{" "}
        object has the following methods:
      </p>
      <CodeBlock
        code={`type Session = {
  readonly id: string
  readonly name?: string
  trackTool: (name: string, input: unknown, fn: () => Promise<unknown>) => Promise<unknown>
  trackDecision: (name: string, reasoning: string, outcome: string) => Promise<void>
  end: () => Promise<void>
}`}
      />
      <CodeBlock
        code={`import { createClient } from '@agentreceipt/sdk'

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY })
const session = ar.startSession('Process invoice #441')

// Track tool calls and decisions within this session
await session.trackTool('look-up-vendor', { name: 'Acme Corp' }, async () => {
  return await db.vendors.findByName('Acme Corp')
})

await session.trackDecision('approve-payment', 'Amount within limit', 'approved')
await session.end()`}
        filename="manual-session.ts"
      />

      {/* trackTool */}
      <h2
        id="tracktool"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        trackTool(name, input, fn, options?)
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Wraps an async function and records it as a tool call event. Captures
        the name, input, output, and duration. If the function throws, the error
        is recorded as an event and then re-thrown.
      </p>
      <CodeBlock
        code={`function trackTool<T>(
  name: string,
  input: unknown,
  fn: () => Promise<T>,
  options?: { compliance?: ComplianceMetadata }
): Promise<T>`}
      />
      <ParamTable
        params={[
          {
            name: "name",
            type: "string",
            required: true,
            description:
              'A descriptive name for the tool, e.g. "send-email", "query-database".',
          },
          {
            name: "input",
            type: "unknown",
            required: true,
            description:
              "The input data passed to the tool. Stored as the event input payload.",
          },
          {
            name: "fn",
            type: "() => Promise<T>",
            required: true,
            description:
              "The async function to execute. Its return value is captured as the event output.",
          },
          {
            name: "options.compliance",
            type: "ComplianceMetadata",
            required: false,
            description:
              "Optional compliance tags for this event. See Compliance metadata.",
          },
        ]}
      />
      <CodeBlock
        code={`const vendor = await session.trackTool(
  'look-up-vendor',
  { vendorName: 'Acme Corp' },
  async () => {
    return await db.vendors.findByName('Acme Corp')
  }
)

// vendor is the return value of the wrapped function
console.log(vendor.name) // "Acme Corp"`}
        filename="track-tool-example.ts"
      />

      {/* trackDecision */}
      <h2
        id="trackdecision"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        trackDecision(name, reasoning, outcome, options?)
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Records a decision event. Use this when your agent makes a choice that
        should be visible in the receipt, like approving a payment or selecting
        a routing path.
      </p>
      <CodeBlock
        code={`function trackDecision(
  name: string,
  reasoning: string,
  outcome: string,
  options?: { compliance?: ComplianceMetadata }
): Promise<void>`}
      />
      <ParamTable
        params={[
          {
            name: "name",
            type: "string",
            required: true,
            description:
              'A descriptive name for the decision, e.g. "approve-payment".',
          },
          {
            name: "reasoning",
            type: "string",
            required: true,
            description:
              "Why the decision was made. This is stored in the event payload.",
          },
          {
            name: "outcome",
            type: "string",
            required: true,
            description:
              'The result of the decision, e.g. "approved", "rejected", "escalated".',
          },
          {
            name: "options.compliance",
            type: "ComplianceMetadata",
            required: false,
            description: "Optional compliance tags for this event.",
          },
        ]}
      />
      <CodeBlock
        code={`await session.trackDecision(
  'approve-payment',
  'Invoice amount $4,500 is within the $5,000 auto-approval limit. Vendor is verified.',
  'approved'
)`}
        filename="track-decision-example.ts"
      />

      {/* trackHumanReview */}
      <h2
        id="trackhumanreview"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        trackHumanReview(params)
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Records a human review event. Use this when a person reviews and
        approves, rejects, or modifies an agent&apos;s proposed action.
      </p>
      <CodeBlock
        code={`function trackHumanReview(params: {
  reviewer: string
  decision: 'approved' | 'rejected' | 'modified'
  notes?: string
  compliance?: ComplianceMetadata
}): Promise<void>`}
      />
      <ParamTable
        params={[
          {
            name: "reviewer",
            type: "string",
            required: true,
            description:
              "Who reviewed the action. Could be a name, email, or user ID.",
          },
          {
            name: "decision",
            type: "'approved' | 'rejected' | 'modified'",
            required: true,
            description: "The reviewer's decision.",
          },
          {
            name: "notes",
            type: "string",
            required: false,
            description: "Optional notes from the reviewer.",
          },
          {
            name: "compliance",
            type: "ComplianceMetadata",
            required: false,
            description: "Optional compliance tags for this event.",
          },
        ]}
      />
      <CodeBlock
        code={`await session.trackHumanReview({
  reviewer: 'jane@acme.com',
  decision: 'approved',
  notes: 'Vendor verified. Amount looks correct.'
})`}
        filename="track-human-review-example.ts"
      />
    </article>
  );
}

function ParamTable({
  params,
}: {
  params: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
}) {
  return (
    <div className="my-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-2 pr-4 font-semibold">Name</th>
            <th className="pb-2 pr-4 font-semibold">Type</th>
            <th className="pb-2 pr-4 font-semibold">Required</th>
            <th className="pb-2 font-semibold">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-border/50">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {p.name}
                </code>
              </td>
              <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                {p.type}
              </td>
              <td className="py-2 pr-4 text-muted-foreground">
                {p.required ? "Yes" : "No"}
              </td>
              <td className="py-2 text-muted-foreground">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
