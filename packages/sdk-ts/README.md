# @agentreceipt/sdk

TypeScript SDK for [AgentReceipt](https://agentreceipt.com). Capture immutable audit trails of your AI agent's actions.

## Install

```bash
npm install @agentreceipt/sdk
```

## Quickstart with OpenAI

```typescript
import OpenAI from "openai";
import { createClient } from "@agentreceipt/sdk";

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY! });
const openai = ar.wrapOpenAI(new OpenAI());

// Every call is now tracked automatically
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello" }],
});
```

## Quickstart with Anthropic

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@agentreceipt/sdk";

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY! });
const anthropic = ar.wrapAnthropic(new Anthropic());

// Every call is now tracked automatically
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }],
});
```

## Session naming

Wrappers accept an optional `sessionName` to label the session in the dashboard:

```typescript
const anthropic = ar.wrapAnthropic(new Anthropic(), {
  sessionName: `Support ticket #${ticket.id}`,
});
```

If you wrap a client once at module level, all requests share one session. For most apps, you want one session per task. Create a new wrapper per request:

```typescript
async function handleTicket(ticket: Ticket) {
  const anthropic = ar.wrapAnthropic(new Anthropic(), {
    sessionName: `Ticket #${ticket.id}`,
  });
  await anthropic.messages.create({ ... });
}
```

<!-- TODO: rewrite this section with better examples, cover wrap-per-task as primary pattern -->

## Manual tracking

For tool calls, decisions, and custom events that are not LLM calls:

```typescript
import { createClient } from "@agentreceipt/sdk";

const ar = createClient({ apiKey: process.env.AGENTRECEIPT_API_KEY! });
const session = ar.startSession("Process invoice #441");

// Track a tool call
const vendor = await session.trackTool(
  "look-up-vendor",
  { vendorName: "Acme Corp" },
  async () => {
    return db.vendors.findByName("Acme Corp");
  },
);

// Track a decision
await session.trackDecision(
  "approve-payment",
  "Amount $450 is within $500 auto-approval limit and vendor is verified",
  "approved",
);

// End the session (flushes any remaining events)
await session.end();
```

## Environment variable

Set `AGENTRECEIPT_API_KEY` in your environment. Get your API key from the AgentReceipt dashboard.

## Configuration

```typescript
const ar = createClient({
  apiKey: "ar_...",
  baseUrl: "https://agentreceipt.com", // optional, defaults to production
});
```
