import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@agentreceipt/sdk";

function getAR() {
  const apiKey = process.env.AGENTRECEIPT_API_KEY;
  const baseUrl = process.env.AGENTRECEIPT_BASE_URL;
  if (!apiKey || !baseUrl) {
    throw new Error("AGENTRECEIPT_API_KEY and AGENTRECEIPT_BASE_URL required");
  }
  return createClient({ apiKey, baseUrl });
}

// Simple tool for tool-calling tests
const wordCountTool = {
  name: "get_word_count",
  description: "Count words in a text string",
  parameters: {
    type: "object" as const,
    properties: { text: { type: "string", description: "The text to count" } },
    required: ["text"],
  },
};

async function runOpenAI(method: string) {
  if (!process.env.OPENAI_API_KEY) throw new Error("KEY:OPENAI_API_KEY");
  const OpenAI = (await import("openai")).default;
  const ar = getAR();
  const openai = ar.wrapOpenAI(new OpenAI(), {
    sessionName: `TestLord: OpenAI ${method}`,
  });

  switch (method) {
    case "standard": {
      const r = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 20,
        messages: [
          { role: "user", content: "Reply with exactly three words." },
        ],
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { output: r.choices[0]?.message?.content };
    }
    case "streaming": {
      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 20,
        stream: true,
        messages: [
          { role: "user", content: "Reply with exactly three words." },
        ],
      });
      const chunks: string[] = [];
      for await (const chunk of stream as AsyncIterable<{
        choices: { delta: { content?: string } }[];
      }>) {
        chunks.push(chunk.choices[0]?.delta?.content ?? "");
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { output: chunks.join("") };
    }
    case "tool-calling": {
      const r = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content:
              'Count the words in this text: "the quick brown fox jumps"',
          },
        ],
        tools: [{ type: "function", function: wordCountTool }],
        tool_choice: "auto",
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { output: r.choices[0]?.message };
    }
    case "structured-output": {
      const r = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 50,
        messages: [
          {
            role: "user",
            content:
              'Return a JSON object with "word" (a random word) and "letters" (number of letters in that word).',
          },
        ],
        response_format: { type: "json_object" },
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { output: r.choices[0]?.message?.content };
    }
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

async function runAnthropic(method: string) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("KEY:ANTHROPIC_API_KEY");
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const ar = getAR();
  const anthropic = ar.wrapAnthropic(new Anthropic(), {
    sessionName: `TestLord: Anthropic ${method}`,
  });

  switch (method) {
    case "standard": {
      const r = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 20,
        messages: [
          { role: "user", content: "Reply with exactly three words." },
        ],
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const text = r.content[0]?.type === "text" ? r.content[0].text : "";
      return { output: text };
    }
    case "streaming": {
      const stream = anthropic.messages.stream({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 20,
        messages: [
          { role: "user", content: "Reply with exactly three words." },
        ],
      });
      const chunks: string[] = [];
      for await (const event of stream as AsyncIterable<{
        type: string;
        delta?: { text?: string };
      }>) {
        if (event.type === "content_block_delta" && event.delta?.text) {
          chunks.push(event.delta.text);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { output: chunks.join("") };
    }
    case "tool-calling": {
      const r = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content:
              'Count the words in this text: "the quick brown fox jumps"',
          },
        ],
        tools: [
          {
            name: "get_word_count",
            description: "Count words in a text string",
            input_schema: {
              type: "object" as const,
              properties: {
                text: { type: "string", description: "The text to count" },
              },
              required: ["text"],
            },
          },
        ],
        tool_choice: { type: "auto" },
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { output: r.content };
    }
    case "structured-output": {
      const r = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 50,
        messages: [
          {
            role: "user",
            content:
              'Return only valid JSON, no markdown: { "word": "<a random word>", "letters": <number of letters> }',
          },
        ],
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const text = r.content[0]?.type === "text" ? r.content[0].text : "";
      return { output: text };
    }
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

async function runGemini(method: string) {
  if (!process.env.GEMINI_API_KEY) throw new Error("KEY:GEMINI_API_KEY");
  const { GoogleGenAI } = await import("@google/genai");
  const ar = getAR();
  const ai = ar.wrapGemini(
    new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }),
    {
      sessionName: `TestLord: Gemini ${method}`,
    },
  );

  switch (method) {
    case "standard": {
      const r = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Reply with exactly three words.",
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { output: (r as { text?: string }).text };
    }
    case "streaming": {
      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: "Reply with exactly three words.",
      });
      const chunks: string[] = [];
      for await (const chunk of stream as AsyncIterable<{
        text?: string;
      }>) {
        chunks.push(chunk.text ?? "");
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { output: chunks.join("") };
    }
    case "tool-calling": {
      const r = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: 'Count the words in: "the quick brown fox jumps"',
        config: {
          tools: [
            {
              functionDeclarations: [
                {
                  name: "get_word_count",
                  description: "Count words in a text string",
                  parametersJsonSchema: {
                    type: "object",
                    properties: {
                      text: {
                        type: "string",
                        description: "The text to count",
                      },
                    },
                    required: ["text"],
                  },
                },
              ],
            },
          ],
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { output: r };
    }
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

async function runMistral(method: string) {
  if (!process.env.MISTRAL_API_KEY) throw new Error("KEY:MISTRAL_API_KEY");
  const { Mistral } = await import("@mistralai/mistralai");
  const ar = getAR();
  const mistral = ar.wrapMistral(
    new Mistral({ apiKey: process.env.MISTRAL_API_KEY }),
    { sessionName: `TestLord: Mistral ${method}` },
  );

  switch (method) {
    case "standard": {
      const r = await mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [
          { role: "user", content: "Reply with exactly three words." },
        ],
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const res = r as {
        choices?: { message?: { content?: string } }[];
      };
      return { output: res.choices?.[0]?.message?.content };
    }
    case "streaming": {
      const stream = await mistral.chat.stream({
        model: "mistral-small-latest",
        messages: [
          { role: "user", content: "Reply with exactly three words." },
        ],
      });
      const chunks: string[] = [];
      for await (const event of stream as AsyncIterable<{
        data?: { choices?: { delta?: { content?: string } }[] };
      }>) {
        chunks.push(event.data?.choices?.[0]?.delta?.content ?? "");
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { output: chunks.join("") };
    }
    case "tool-calling": {
      const r = await mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [
          {
            role: "user",
            content:
              'Count the words in this text: "the quick brown fox jumps"',
          },
        ],
        tools: [
          {
            type: "function",
            function: wordCountTool,
          },
        ],
        toolChoice: "auto",
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const res = r as {
        choices?: { message?: unknown }[];
      };
      return { output: res.choices?.[0]?.message };
    }
    case "structured-output": {
      const r = await mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [
          {
            role: "user",
            content:
              'Return only valid JSON: { "word": "<a random word>", "letters": <number of letters> }',
          },
        ],
        responseFormat: { type: "json_object" },
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const res = r as {
        choices?: { message?: { content?: string } }[];
      };
      return { output: res.choices?.[0]?.message?.content };
    }
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

async function runVercelAI(method: string) {
  if (!process.env.OPENAI_API_KEY) throw new Error("KEY:OPENAI_API_KEY");
  const { openai } = await import("@ai-sdk/openai");
  const ai = await import("ai");
  const ar = getAR();
  const wrapped = ar.wrapVercelAI(
    {
      generateText: ai.generateText as unknown as (
        ...args: unknown[]
      ) => Promise<unknown>,
      streamText: ai.streamText as unknown as (
        ...args: unknown[]
      ) => Promise<unknown>,
      generateObject: ai.generateObject as unknown as (
        ...args: unknown[]
      ) => Promise<unknown>,
      streamObject: ai.streamObject as unknown as (
        ...args: unknown[]
      ) => Promise<unknown>,
    },
    { sessionName: `TestLord: Vercel AI ${method}` },
  );

  switch (method) {
    case "standard": {
      const r = await wrapped.generateText!({
        model: openai("gpt-4o-mini"),
        maxTokens: 20,
        prompt: "Reply with exactly three words.",
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { output: (r as { text: string }).text };
    }
    case "streaming": {
      const r = await wrapped.streamText!({
        model: openai("gpt-4o-mini"),
        maxTokens: 20,
        prompt: "Reply with exactly three words.",
      });
      let output = "";
      for await (const chunk of (r as { textStream: AsyncIterable<string> })
        .textStream) {
        output += chunk;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { output };
    }
    case "structured-output": {
      const { z } = await import("zod");
      const r = await wrapped.generateObject!({
        model: openai("gpt-4o-mini"),
        schema: z.object({
          word: z.string(),
          letters: z.number(),
        }),
        prompt: "Pick a random word and count its letters.",
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { output: (r as { object: unknown }).object };
    }
    case "streaming-structured-output": {
      const { z } = await import("zod");
      const r = await wrapped.streamObject!({
        model: openai("gpt-4o-mini"),
        schema: z.object({
          word: z.string(),
          letters: z.number(),
        }),
        prompt: "Pick a random word and count its letters.",
      });
      const res = r as {
        partialObjectStream: AsyncIterable<unknown>;
        object: Promise<unknown>;
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of res.partialObjectStream) {
        // consume stream to drive it to completion
      }
      const obj = await res.object;
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { output: obj };
    }
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

async function runFeatures(method: string) {
  const ar = getAR();

  switch (method) {
    case "human-review": {
      const session = ar.startSession("TestLord: Human review (approved)");
      await session.trackHumanReview({
        reviewer: "qa-tester@example.com",
        decision: "approved",
        notes: "Approved during TestLord run",
      });
      await session.end();
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return {
        output: {
          sessionId: session.id,
          event: "human_review",
          decision: "approved",
          reviewer: "qa-tester@example.com",
        },
      };
    }
    case "human-review-rejected": {
      const session = ar.startSession(
        "TestLord: Human review (rejected with notes)",
      );
      await session.trackHumanReview({
        reviewer: "compliance-officer@example.com",
        decision: "rejected",
        notes: "Amount exceeds policy limit. Needs VP approval.",
      });
      await session.end();
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return {
        output: {
          sessionId: session.id,
          event: "human_review",
          decision: "rejected",
          reviewer: "compliance-officer@example.com",
          notes: "Amount exceeds policy limit. Needs VP approval.",
        },
      };
    }
    case "pii-compliance": {
      const session = ar.startSession("TestLord: PII compliance metadata");
      await session.trackTool(
        "read-patient-record",
        { patientId: "test-patient-001" },
        async () => ({
          name: "Jane Doe",
          condition: "test-data",
          redacted: true,
        }),
        {
          compliance: {
            containsPII: true,
            dataCategory: "health",
            retentionOverride: 2190,
          },
        },
      );
      await session.end();
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return {
        output: {
          sessionId: session.id,
          event: "tool_call with compliance",
          compliance: {
            containsPII: true,
            dataCategory: "health",
            retentionOverride: 2190,
          },
        },
      };
    }
    case "explicit-end": {
      const session = ar.startSession("TestLord: Explicit session.end()");

      await session.trackTool(
        "fetch-order",
        { orderId: "ord-9921" },
        async () => ({
          id: "ord-9921",
          item: "Widget Pro",
          quantity: 3,
          total: 89.97,
        }),
      );

      await session.trackDecision(
        "approve-shipment",
        "Order total $89.97 is under $100 auto-ship threshold. Stock available.",
        "approved",
      );

      await session.trackTool(
        "create-shipment",
        { orderId: "ord-9921", carrier: "USPS" },
        async () => ({
          shipmentId: "shp-4401",
          trackingNumber: "9400111899223456789012",
          status: "label_created",
        }),
      );

      await session.end();

      return {
        output: {
          sessionId: session.id,
          events: [
            "tool_call (fetch-order)",
            "decision (approve-shipment)",
            "tool_call (create-shipment)",
            "decision (session.end)",
          ],
          note: "Session explicitly completed via session.end()",
        },
      };
    }
    case "decision-context": {
      const session = ar.startSession(
        "TestLord: Invoice processing with decision context",
        {
          context: {
            systemPrompt:
              "You are an accounts payable agent. Process invoices, verify vendors, and trigger payments. Follow all approval rules.",
            activeRules: [
              {
                id: "auto-approve-threshold",
                description:
                  "Auto-approve payments under $5,000 for verified vendors",
                parameters: { threshold: 5000, currency: "USD" },
              },
              {
                id: "vendor-must-be-verified",
                description:
                  "Vendor must exist in the database and be marked as verified",
              },
              {
                id: "duplicate-invoice-check",
                description:
                  "Reject invoices with the same number from the same vendor within 30 days",
                parameters: { windowDays: 30 },
              },
            ],
            permissions: [
              "read:invoices",
              "read:vendors",
              "write:payments",
              "write:audit-log",
            ],
            environment: {
              accountTier: "business",
              region: "us-east-1",
              approver: "ap-agent@widgetinc.com",
            },
          },
        },
      );

      // Step 1: Parse invoice
      await session.trackTool(
        "parse-invoice",
        {
          rawText:
            "Invoice #892\nFrom: Acme Corp\nAmount: $3,200\nDue: 2026-05-01",
        },
        async () => ({
          invoiceNumber: "892",
          vendor: "Acme Corp",
          amount: 3200,
          currency: "USD",
          dueDate: "2026-05-01",
        }),
      );

      // Step 2: Vendor lookup
      await session.trackTool(
        "lookup-vendor",
        { vendorName: "Acme Corp" },
        async () => ({
          id: "vendor_0042",
          name: "Acme Corp",
          verified: true,
          autoApprovalLimit: 5000,
        }),
      );

      // Step 3: Decision with per-event context
      await session.trackDecision(
        "approve-payment",
        "Invoice amount $3,200 is under the $5,000 auto-approval threshold. Vendor is verified. No duplicate invoices found.",
        "approved",
        {
          context: {
            rulesEvaluated: [
              "auto-approve-threshold",
              "vendor-must-be-verified",
              "duplicate-invoice-check",
            ],
            stateAtDecision: {
              invoiceAmount: 3200,
              approvalThreshold: 5000,
              vendorVerified: true,
              duplicateFound: false,
            },
          },
        },
      );

      // Step 4: Trigger payment
      await session.trackTool(
        "trigger-payment",
        { vendorId: "vendor_0042", amount: 3200, currency: "USD" },
        async () => ({
          paymentId: "pay_7x2m9k",
          status: "initiated",
          estimatedArrival: "2026-04-05",
        }),
      );

      await session.end();
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return {
        output: {
          sessionId: session.id,
          events: [
            "tool_call (parse-invoice)",
            "tool_call (lookup-vendor)",
            "decision (approve-payment, with context)",
            "tool_call (trigger-payment)",
          ],
          sessionContext:
            "system prompt + 3 rules + 4 permissions + environment",
        },
      };
    }
    case "context-change": {
      const session = ar.startSession("TestLord: Mid-session context change", {
        context: {
          systemPrompt: "You are a payment processing agent.",
          activeRules: [
            {
              id: "approval-threshold",
              description: "Auto-approve under $5,000",
              parameters: { threshold: 5000 },
            },
          ],
          permissions: ["write:payments"],
        },
      });

      await session.trackTool(
        "check-balance",
        { accountId: "acct-001" },
        async () => ({ balance: 25000, currency: "USD" }),
      );

      // Mid-session rule change
      await session.trackContextChange(
        "approval-threshold-updated",
        { threshold: 5000 },
        { threshold: 10000 },
      );

      await session.trackDecision(
        "approve-large-payment",
        "Payment of $8,500 is under the updated $10,000 threshold.",
        "approved",
        {
          context: {
            rulesEvaluated: ["approval-threshold"],
            stateAtDecision: {
              paymentAmount: 8500,
              currentThreshold: 10000,
              previousThreshold: 5000,
            },
          },
        },
      );

      await session.end();
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return {
        output: {
          sessionId: session.id,
          events: [
            "tool_call (check-balance)",
            "context_change (approval-threshold-updated)",
            "decision (approve-large-payment, with context)",
          ],
        },
      };
    }
    case "combined": {
      const session = ar.startSession(
        "TestLord: Full session with human review and PII",
      );

      // Step 1: Tool call with PII
      const record = await session.trackTool(
        "fetch-financial-record",
        { accountId: "acct-test-42" },
        async () => ({
          accountHolder: "Test User",
          balance: 12500,
          currency: "USD",
        }),
        {
          compliance: {
            containsPII: true,
            dataCategory: "financial",
          },
        },
      );

      // Step 2: Decision
      await session.trackDecision(
        "approve-transfer",
        `Balance is ${record.balance} ${record.currency}. Transfer amount within limits.`,
        "approved",
      );

      // Step 3: Human review
      await session.trackHumanReview({
        reviewer: "manager@example.com",
        decision: "modified",
        notes: "Approved with reduced amount. Changed from $12,500 to $10,000.",
        compliance: {
          containsPII: false,
          dataCategory: "financial",
        },
      });

      // Step 4: Final tool call
      await session.trackTool(
        "execute-transfer",
        { amount: 10000, currency: "USD", to: "acct-test-99" },
        async () => ({ transferId: "txn-test-001", status: "completed" }),
      );

      await session.end();
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return {
        output: {
          sessionId: session.id,
          events: [
            "tool_call (fetch-financial-record, PII)",
            "decision (approve-transfer)",
            "human_review (modified)",
            "tool_call (execute-transfer)",
          ],
        },
      };
    }
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

const runners: Record<
  string,
  (method: string) => Promise<{ output: unknown }>
> = {
  openai: runOpenAI,
  anthropic: runAnthropic,
  gemini: runGemini,
  mistral: runMistral,
  "vercel-ai": runVercelAI,
  features: runFeatures,
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ provider: string; method: string }> },
) {
  const { provider, method } = await params;
  const runner = runners[provider];

  if (!runner) {
    return NextResponse.json(
      { success: false, error: `Unknown provider: ${provider}` },
      { status: 400 },
    );
  }

  try {
    const result = await runner(method);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.startsWith("KEY:")) {
      return NextResponse.json(
        {
          success: false,
          error: `API key not configured: ${message.slice(4)}`,
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
