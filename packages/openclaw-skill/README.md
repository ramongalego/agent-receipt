# AgentReceipt OpenClaw Skill

Logs your OpenClaw agent's actions to AgentReceipt and gives you a shareable receipt link when the task is done. Every LLM call, tool call, and decision is captured in a tamper-proof audit trail.

## Install

```
clawhub install agentreceipt
```

## Setup

1. Create a free account at [agentreceipt.co](https://agentreceipt.co)
2. Create a project and generate an API key
3. Add the key to your OpenClaw environment:

```
AGENTRECEIPT_API_KEY=ar_live_...
```

## What happens

Once installed, your OpenClaw agent picks up the skill automatically. It logs its actions during multi-step tasks, marks the session complete, and then shares a receipt link with you. You do not need to write any code or change your agent's prompts.

See `SKILL.md` for the full command reference and examples.

## Privacy

Event descriptions are sent to agentreceipt.co over HTTPS. The skill instructs the agent to never include sensitive data (passwords, API keys, PII, file contents) in descriptions. Only short summaries of actions are logged, not raw payloads. Treat your `AGENTRECEIPT_API_KEY` as a secret and rotate it if you suspect exposure. Review the [privacy policy](https://agentreceipt.co/privacy) for details on data handling.

## Docs

Full documentation at [agentreceipt.co/docs](https://agentreceipt.co/docs).
