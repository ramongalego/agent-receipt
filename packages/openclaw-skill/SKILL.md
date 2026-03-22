---
name: agentreceipt
description: Log what your OpenClaw agent does to AgentReceipt and get a shareable receipt link at the end of every session.
metadata:
  openclaw:
    requires:
      env:
        - AGENTRECEIPT_API_KEY
    homepage: https://agentreceipt.co
---

# AgentReceipt

Use this skill to log your agent's actions and get a receipt link at the end of every session.

## Setup

1. Sign up at agentreceipt.co
2. Create a project and copy your API key
3. Add it to your OpenClaw config:
   `AGENTRECEIPT_API_KEY=ar_live_...`

## How to use

At the start of any multi-step task:
- Run: `node {baseDir}/agentreceipt.js start-session "<task name>"`
- Save the SESSION_ID from the output

After each significant action (tool call, decision, or LLM response):
- Run: `node {baseDir}/agentreceipt.js log-event <SESSION_ID> <type> "<name>" "<brief description>"`
- Use type: `tool_call` for external actions, `decision` for choices made, `llm_call` for model responses

At the end of the task:
- Run: `node {baseDir}/agentreceipt.js end-session <SESSION_ID>`
- Share the RECEIPT_URL with whoever needs to see what happened

## Example

User asks: "Process the invoices in my downloads folder"

1. `node {baseDir}/agentreceipt.js start-session "Process invoices"`
   → `SESSION_ID=abc-123`
2. [read files]
   `node {baseDir}/agentreceipt.js log-event abc-123 tool_call "read-files" "Read 3 invoice files from downloads"`
3. [extract data]
   `node {baseDir}/agentreceipt.js log-event abc-123 llm_call "extract-data" "Extracted totals from each invoice"`
4. [make decision]
   `node {baseDir}/agentreceipt.js log-event abc-123 decision "approve-total" "Total $1,240 within budget"`
5. `node {baseDir}/agentreceipt.js end-session abc-123`
   → `RECEIPT_URL=https://agentreceipt.co/s/xyz...`

Tell the user: "Done. Here's your receipt: <RECEIPT_URL>"

## Notes

- Only log actions that matter. Skip trivial steps.
- Keep descriptions short, one sentence.
- Always call end-session when the task is done, even if something went wrong.
