#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as https from "https";
import * as http from "http";
import * as crypto from "crypto";

const API_KEY = process.env.AGENTRECEIPT_API_KEY;
const BASE_URL = process.env.AGENTRECEIPT_BASE_URL || "https://agentreceipt.co";

if (!API_KEY) {
  process.stderr.write(
    "Error: AGENTRECEIPT_API_KEY is not set. Get one at https://agentreceipt.co/dashboard\n",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

type HttpResponse = {
  data?: Record<string, unknown>;
  error?: string;
};

function request(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const mod = url.protocol === "https:" ? https : http;
    const data = body ? JSON.stringify(body) : null;

    const req = mod.request(
      url,
      {
        method,
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          ...(data
            ? { "Content-Length": String(Buffer.byteLength(data)) }
            : {}),
        },
      },
      (res) => {
        let chunks = "";
        res.on("data", (c: Buffer) => {
          chunks += c;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${chunks}`));
          } else {
            try {
              resolve(JSON.parse(chunks) as HttpResponse);
            } catch {
              reject(new Error(`Invalid JSON response: ${chunks}`));
            }
          }
        });
      },
    );

    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "start_session",
    description:
      "Start a new AgentReceipt session to track AI agent actions. Call this at the beginning of a task. Returns a sessionId you will pass to log_event and end_session.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "A short name for this session.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "log_event",
    description:
      "Log an action to an AgentReceipt session. Call this each time the agent makes an LLM call, uses a tool, or makes a decision. Never include sensitive data in descriptions (passwords, API keys, PII, file contents). Describe what you did, not the raw data.",
    inputSchema: {
      type: "object" as const,
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID from start_session.",
        },
        type: {
          type: "string",
          enum: ["tool_call", "llm_call", "decision"],
          description:
            "tool_call for tool/function calls, llm_call for LLM API calls, decision for reasoning steps.",
        },
        name: {
          type: "string",
          description:
            "A short name for the action, e.g. 'read_file' or 'gpt-4o'.",
        },
        description: {
          type: "string",
          description: "A brief description of what happened.",
        },
      },
      required: ["sessionId", "type", "name", "description"],
    },
  },
  {
    name: "end_session",
    description:
      "End an AgentReceipt session. Call this when the task is complete. After ending, call share_session to give the user a receipt link.",
    inputSchema: {
      type: "object" as const,
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID from start_session.",
        },
      },
      required: ["sessionId"],
    },
  },
  {
    name: "share_session",
    description:
      "Generate a shareable receipt link for a completed session. Call this at the end of a task to give the user a URL where they can see everything the agent did.",
    inputSchema: {
      type: "object" as const,
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID from start_session.",
        },
      },
      required: ["sessionId"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

async function handleStartSession(args: Record<string, unknown>) {
  const name = args.name as string;
  const sessionId = crypto.randomUUID();
  try {
    const res = await request("POST", "/api/ingest", {
      sessionId,
      sessionName: name,
      event: {
        type: "decision",
        name: "session.start",
        input: { sessionName: name },
        output: { status: "started" },
        durationMs: 0,
      },
    });
    if (!res.data) {
      return textResult("Failed to start session. Unexpected response.");
    }
    return textResult(
      `Session started. Session ID: ${sessionId}\n\nUse this ID with log_event to record actions, then call end_session when done.`,
    );
  } catch (err) {
    return textResult(`Failed to start session: ${errMsg(err)}`);
  }
}

async function handleLogEvent(args: Record<string, unknown>) {
  const sessionId = args.sessionId as string;
  const type = args.type as string;
  const name = args.name as string;
  const description = args.description as string;

  const validTypes = ["tool_call", "llm_call", "decision"];
  if (!validTypes.includes(type)) {
    return textResult(
      `Invalid event type "${type}". Use one of: ${validTypes.join(", ")}`,
    );
  }

  try {
    const res = await request("POST", "/api/ingest", {
      sessionId,
      event: {
        type,
        name,
        input: { description },
        output: { status: "ok" },
        durationMs: 0,
      },
    });
    if (!res.data) {
      return textResult("Failed to log event. Unexpected response.");
    }
    return textResult(`Event logged: [${type}] ${name}`);
  } catch (err) {
    return textResult(`Failed to log event: ${errMsg(err)}`);
  }
}

async function handleEndSession(args: Record<string, unknown>) {
  const sessionId = args.sessionId as string;
  try {
    const res = await request("POST", "/api/ingest", {
      sessionId,
      event: {
        type: "decision",
        name: "session.end",
        input: { reason: "task complete" },
        output: { status: "ended" },
        durationMs: 0,
      },
    });
    if (!res.data) {
      return textResult("Failed to end session. Unexpected response.");
    }
    return textResult(
      "Session ended. Call share_session to get a receipt link for the user.",
    );
  } catch (err) {
    return textResult(`Failed to end session: ${errMsg(err)}`);
  }
}

async function handleShareSession(args: Record<string, unknown>) {
  const sessionId = args.sessionId as string;
  try {
    const res = await request("POST", `/api/sessions/${sessionId}/share`, {});
    if (!res.data || !res.data.url) {
      return textResult("Failed to generate share link. Unexpected response.");
    }
    return textResult(`Receipt link: ${res.data.url}`);
  } catch (err) {
    return textResult(`Failed to generate share link: ${errMsg(err)}`);
  }
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new Server(
  { name: "AgentReceipt", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const toolArgs = (args ?? {}) as Record<string, unknown>;

  switch (name) {
    case "start_session":
      return handleStartSession(toolArgs);
    case "log_event":
      return handleLogEvent(toolArgs);
    case "end_session":
      return handleEndSession(toolArgs);
    case "share_session":
      return handleShareSession(toolArgs);
    default:
      return textResult(`Unknown tool: ${name}`);
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`MCP server error: ${err}\n`);
  process.exit(1);
});
