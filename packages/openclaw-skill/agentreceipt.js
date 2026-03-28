#!/usr/bin/env node
"use strict";

const https = require("https");
const http = require("http");
const crypto = require("crypto");

const API_KEY = process.env.AGENTRECEIPT_API_KEY;
const BASE_URL = process.env.AGENTRECEIPT_BASE_URL || "https://agentreceipt.co";

function fail(msg) {
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(1);
}

if (!API_KEY) fail("AGENTRECEIPT_API_KEY is not set.");

function request(method, path, body) {
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
          ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let chunks = "";
        res.on("data", (c) => {
          chunks += c;
        });
        res.on("end", () => {
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${chunks}`));
          } else {
            resolve(JSON.parse(chunks));
          }
        });
      },
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function startSession(name) {
  const sessionId = crypto.randomUUID();
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
  if (!res.data) fail("Unexpected response from ingest endpoint.");
  process.stdout.write(`SESSION_ID=${res.data.sessionId}\n`);
}

async function logEvent(sessionId, type, name, description) {
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
  if (!res.data) fail("Unexpected response from ingest endpoint.");
  process.stdout.write(`EVENT_ID=${res.data.eventId}\n`);
}

async function endSession(sessionId) {
  await request("POST", "/api/ingest", {
    sessionId,
    event: {
      type: "decision",
      name: "session.end",
      input: { reason: "task complete" },
      output: { status: "ended" },
      durationMs: 0,
    },
  });
  const share = await request("POST", `/api/sessions/${sessionId}/share`, {});
  if (!share.data) fail("Unexpected response from share endpoint.");
  process.stdout.write(`RECEIPT_URL=${share.data.url}\n`);
}

const [, , cmd, ...args] = process.argv;

(async () => {
  try {
    if (cmd === "start-session") {
      if (!args[0]) fail("Usage: start-session <sessionName>");
      await startSession(args[0]);
    } else if (cmd === "log-event") {
      if (args.length < 4)
        fail("Usage: log-event <sessionId> <type> <name> <description>");
      await logEvent(args[0], args[1], args[2], args[3]);
    } else if (cmd === "end-session") {
      if (!args[0]) fail("Usage: end-session <sessionId>");
      await endSession(args[0]);
    } else {
      fail("Unknown command. Use: start-session, log-event, or end-session");
    }
  } catch (e) {
    fail(e.message);
  }
})();
