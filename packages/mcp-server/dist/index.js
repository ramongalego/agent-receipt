#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const crypto = __importStar(require("crypto"));
const API_KEY = process.env.AGENTRECEIPT_API_KEY;
const BASE_URL = process.env.AGENTRECEIPT_BASE_URL || "https://agentreceipt.co";
if (!API_KEY) {
    process.stderr.write("Error: AGENTRECEIPT_API_KEY is not set. Get one at https://agentreceipt.co/dashboard\n");
    process.exit(1);
}
function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const mod = url.protocol === "https:" ? https : http;
        const data = body ? JSON.stringify(body) : null;
        const req = mod.request(url, {
            method,
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                ...(data
                    ? { "Content-Length": String(Buffer.byteLength(data)) }
                    : {}),
            },
        }, (res) => {
            let chunks = "";
            res.on("data", (c) => {
                chunks += c;
            });
            res.on("end", () => {
                if (res.statusCode && res.statusCode >= 400) {
                    reject(new Error(`HTTP ${res.statusCode}: ${chunks}`));
                }
                else {
                    try {
                        resolve(JSON.parse(chunks));
                    }
                    catch {
                        reject(new Error(`Invalid JSON response: ${chunks}`));
                    }
                }
            });
        });
        req.on("error", reject);
        if (data)
            req.write(data);
        req.end();
    });
}
function textResult(text) {
    return { content: [{ type: "text", text }] };
}
function errMsg(err) {
    return err instanceof Error ? err.message : String(err);
}
// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------
const TOOLS = [
    {
        name: "start_session",
        description: "Start a new AgentReceipt session to track AI agent actions. Call this at the beginning of a task. Returns a sessionId you will pass to log_event and end_session.",
        inputSchema: {
            type: "object",
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
        description: "Log an action to an AgentReceipt session. Call this each time the agent makes an LLM call, uses a tool, or makes a decision.",
        inputSchema: {
            type: "object",
            properties: {
                sessionId: {
                    type: "string",
                    description: "The session ID from start_session.",
                },
                type: {
                    type: "string",
                    enum: ["tool_call", "llm_call", "decision"],
                    description: "tool_call for tool/function calls, llm_call for LLM API calls, decision for reasoning steps.",
                },
                name: {
                    type: "string",
                    description: "A short name for the action, e.g. 'read_file' or 'gpt-4o'.",
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
        description: "End an AgentReceipt session. Call this when the task is complete. After ending, call share_session to give the user a receipt link.",
        inputSchema: {
            type: "object",
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
        description: "Generate a shareable receipt link for a completed session. Call this at the end of a task to give the user a URL where they can see everything the agent did.",
        inputSchema: {
            type: "object",
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
async function handleStartSession(args) {
    const name = args.name;
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
        return textResult(`Session started. Session ID: ${sessionId}\n\nUse this ID with log_event to record actions, then call end_session when done.`);
    }
    catch (err) {
        return textResult(`Failed to start session: ${errMsg(err)}`);
    }
}
async function handleLogEvent(args) {
    const sessionId = args.sessionId;
    const type = args.type;
    const name = args.name;
    const description = args.description;
    const validTypes = ["tool_call", "llm_call", "decision"];
    if (!validTypes.includes(type)) {
        return textResult(`Invalid event type "${type}". Use one of: ${validTypes.join(", ")}`);
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
    }
    catch (err) {
        return textResult(`Failed to log event: ${errMsg(err)}`);
    }
}
async function handleEndSession(args) {
    const sessionId = args.sessionId;
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
        return textResult("Session ended. Call share_session to get a receipt link for the user.");
    }
    catch (err) {
        return textResult(`Failed to end session: ${errMsg(err)}`);
    }
}
async function handleShareSession(args) {
    const sessionId = args.sessionId;
    try {
        const res = await request("POST", `/api/sessions/${sessionId}/share`, {});
        if (!res.data || !res.data.url) {
            return textResult("Failed to generate share link. Unexpected response.");
        }
        return textResult(`Receipt link: ${res.data.url}`);
    }
    catch (err) {
        return textResult(`Failed to generate share link: ${errMsg(err)}`);
    }
}
// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------
const server = new index_js_1.Server({ name: "AgentReceipt", version: "0.1.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
    tools: TOOLS,
}));
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    const toolArgs = (args ?? {});
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
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    process.stderr.write(`MCP server error: ${err}\n`);
    process.exit(1);
});
