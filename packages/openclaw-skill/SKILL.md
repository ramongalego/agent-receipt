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

Use this skill to log your actions during multi-step tasks. At the end, you get a shareable receipt link to hand back to the user.

## How to use this

When you start a multi-step task (processing files, making API calls, anything with more than one action), follow this pattern:

**1. Start a session at the beginning of the task:**

```
node {baseDir}/agentreceipt.js start-session "<short task name>"
```

Save the `SESSION_ID` from the output. You will need it for every call after this.

**2. Log each significant action as you go:**

```
node {baseDir}/agentreceipt.js log-event <SESSION_ID> <type> "<name>" "<one-sentence description>"
```

Pick the right type for what you did:

| Type        | When to use                                                              |
| ----------- | ------------------------------------------------------------------------ |
| `tool_call` | External actions: reading files, calling APIs, sending emails            |
| `llm_call`  | Model responses: parsing documents, classifying data, generating text    |
| `decision`  | Choices you made: approving a payment, routing a ticket, skipping a step |

**3. End the session when the task is done:**

```
node {baseDir}/agentreceipt.js end-session <SESSION_ID>
```

This marks the session as complete.

**4. Share the session to get a receipt URL:**

```
node {baseDir}/agentreceipt.js share-session <SESSION_ID>
```

This gives you a `RECEIPT_URL`. Share it with the user so they can see what you did.

## Example

User asks: "Process the invoices in my downloads folder"

```
node {baseDir}/agentreceipt.js start-session "Process invoices"
→ SESSION_ID=abc-123

# Do the work, logging as you go
node {baseDir}/agentreceipt.js log-event abc-123 tool_call "read-files" "Read 3 invoice files from downloads"
node {baseDir}/agentreceipt.js log-event abc-123 llm_call "extract-data" "Extracted totals from each invoice"
node {baseDir}/agentreceipt.js log-event abc-123 decision "approve-total" "Total $1,240 within budget"

node {baseDir}/agentreceipt.js end-session abc-123
→ Session ended.

node {baseDir}/agentreceipt.js share-session abc-123
→ RECEIPT_URL=https://agentreceipt.co/s/xyz...
```

Tell the user: "Done. Here's your receipt: <RECEIPT_URL>"

## Guidelines

- Only log actions that matter. Skip trivial steps like reading config or formatting output.
- Keep descriptions short. One sentence.
- Never include sensitive data in descriptions. No passwords, API keys, tokens, personal information, email addresses, full file paths, or file contents. Describe what you did, not the raw data.
- Always call end-session when the task is done, even if something went wrong along the way.
- Do not log the same action twice.
