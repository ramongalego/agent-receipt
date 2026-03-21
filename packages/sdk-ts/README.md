# @agentreceipt/sdk

TypeScript SDK for [AgentReceipt](https://agentreceipt.co). Capture immutable audit trails of every action your AI agent takes.

## Installation

```bash
npm install @agentreceipt/sdk
```

## Environment variable

Set `AGENTRECEIPT_API_KEY` in your environment. You can get your key from the [AgentReceipt dashboard](https://agentreceipt.co).

```bash
export AGENTRECEIPT_API_KEY="ar_live_..."
```

## Quickstart: OpenAI

```typescript
import OpenAI from "openai";
import { createClient } from "@agentreceipt/sdk";

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY! });
const openai = ar.wrapOpenAI(new OpenAI(), {
  sessionName: "Process invoice #441",
});

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Parse this invoice." }],
});
```

## Quickstart: Anthropic

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@agentreceipt/sdk";

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY! });
const anthropic = ar.wrapAnthropic(new Anthropic(), {
  sessionName: "Review support ticket #89",
});

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Summarize this ticket." }],
});
```

## Quickstart: Gemini

```typescript
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@agentreceipt/sdk";

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY! });
const ai = ar.wrapGemini(
  new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! }),
  {
    sessionName: "Classify document",
  },
);

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "What type of document is this?",
});
```

## Quickstart: Mistral

```typescript
import { Mistral } from "@mistralai/mistralai";
import { createClient } from "@agentreceipt/sdk";

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY! });
const mistral = ar.wrapMistral(
  new Mistral({ apiKey: process.env.MISTRAL_API_KEY! }),
  {
    sessionName: "Extract receipt data",
  },
);

const response = await mistral.chat.complete({
  model: "mistral-small-latest",
  messages: [{ role: "user", content: "Extract the total from this receipt." }],
});
```

## Quickstart: Vercel AI SDK

```typescript
import { generateText, streamText, generateObject, streamObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@agentreceipt/sdk";

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY! });
const wrapped = ar.wrapVercelAI(
  { generateText, streamText, generateObject, streamObject },
  {
    sessionName: "Chat session #12",
  },
);

const result = await wrapped.generateText({
  model: openai("gpt-4o-mini"),
  prompt: "Reply with exactly three words.",
});
```

## Sessions

Every wrapper creates one session automatically. For most apps, you want one session per task. Create a new wrapper per request.

```typescript
async function handleTicket(ticket: Ticket) {
  const anthropic = ar.wrapAnthropic(new Anthropic(), {
    sessionName: `Ticket #${ticket.id}`,
  });
  await anthropic.messages.create({ ... });
}
```

You can also create sessions manually with `startSession`.

```typescript
const session = ar.startSession("Process invoice #441");
```

## trackTool

Wraps an async function and records its input, output, and duration. If the function throws, the error is recorded and re-thrown.

```typescript
const vendor = await session.trackTool(
  "look-up-vendor",
  { vendorName: "Acme Corp" },
  async () => {
    return db.vendors.findByName("Acme Corp");
  },
);
```

## trackDecision

Records a decision your agent made. Takes a name, reasoning, and outcome.

```typescript
await session.trackDecision(
  "approve-payment",
  "Amount $450 is within $500 auto-approval limit. Vendor is verified.",
  "approved",
);
```

## trackHumanReview

Records a human review step. Useful for approval workflows where a person signs off before the agent proceeds.

```typescript
await session.trackHumanReview({
  reviewer: "sarah@acmecorp.com",
  decision: "approved",
  notes: "Amount within $5,000 auto-approval policy",
});
```

The `decision` field accepts `"approved"`, `"rejected"`, or `"modified"`.

Human review events appear with a purple badge in the dashboard. No payload is stored in R2 for this event type.

## Compliance metadata

Tag any event with compliance metadata to flag sensitive data. Events with `containsPII: true` or a `dataCategory` show a PII badge in the dashboard.

```typescript
await session.trackTool(
  "read-patient-record",
  { patientId: "pt-1234" },
  async () => fetchPatientRecord("pt-1234"),
  {
    compliance: {
      containsPII: true,
      dataCategory: "health",
      retentionOverride: 2190, // days, overrides project default
    },
  },
);
```

Works with `trackDecision` and `trackHumanReview` too.

```typescript
await session.trackDecision(
  "approve-referral",
  "Patient meets criteria for specialist referral.",
  "approved",
  { compliance: { containsPII: true, dataCategory: "health" } },
);

await session.trackHumanReview({
  reviewer: "dr.smith@hospital.org",
  decision: "approved",
  compliance: { containsPII: false, dataCategory: "health" },
});
```

## Ending a session

Call `end()` to flush any queued events. Always call this before your process exits.

```typescript
await session.end();
```

## Configuration

```typescript
const ar = createClient({
  apiKey: "ar_live_...",
  baseUrl: "https://agentreceipt.co", // optional, defaults to production
});
```

## Links

- [Dashboard](https://agentreceipt.co)
- [Documentation](https://agentreceipt.co/docs)
