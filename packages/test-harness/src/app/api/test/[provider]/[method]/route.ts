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
        model: "gemini-2.0-flash",
        contents: "Reply with exactly three words.",
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return { output: (r as { text?: string }).text };
    }
    case "streaming": {
      const stream = await ai.models.generateContentStream({
        model: "gemini-2.0-flash",
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
        model: "gemini-2.0-flash",
        contents: 'Count the words in: "the quick brown fox jumps"',
        config: {
          tools: [
            {
              functionDeclarations: [
                {
                  name: "get_word_count",
                  description: "Count words in a text string",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      text: {
                        type: "STRING",
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
      generateText: ai.generateText,
      streamText: ai.streamText,
      generateObject: ai.generateObject,
      streamObject: ai.streamObject,
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
      for await (const _chunk of res.partialObjectStream) {
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

const runners: Record<
  string,
  (method: string) => Promise<{ output: unknown }>
> = {
  openai: runOpenAI,
  anthropic: runAnthropic,
  gemini: runGemini,
  mistral: runMistral,
  "vercel-ai": runVercelAI,
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
