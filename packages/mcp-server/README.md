# @agentreceipt/mcp

An MCP (Model Context Protocol) server that logs AI agent actions to [AgentReceipt](https://agentreceipt.co). Every tool call, LLM call, and decision gets recorded as an immutable audit trail. At the end of a task, the agent can share a receipt link with the user.

## Setup

You need an AgentReceipt API key. Create one at [agentreceipt.co/dashboard](https://agentreceipt.co/dashboard) inside any project.

### Claude Desktop

Add this to your Claude Desktop config file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "agentreceipt": {
      "command": "npx",
      "args": ["-y", "@agentreceipt/mcp"],
      "env": {
        "AGENTRECEIPT_API_KEY": "ar_live_your_key_here"
      }
    }
  }
}
```

### Claude Code

Add this to your Claude Code config (`.claude/settings.json` or global settings):

```json
{
  "mcpServers": {
    "agentreceipt": {
      "command": "npx",
      "args": ["-y", "@agentreceipt/mcp"],
      "env": {
        "AGENTRECEIPT_API_KEY": "ar_live_your_key_here"
      }
    }
  }
}
```

### Cursor

Add the same config to your Cursor MCP settings. The format is identical to the examples above.

This server works with any MCP-compatible client.

## Tools

The server exposes four tools:

| Tool            | What it does                                          |
| --------------- | ----------------------------------------------------- |
| `start_session` | Creates a new session. Returns a session ID.          |
| `log_event`     | Logs a tool call, LLM call, or decision to a session. |
| `end_session`   | Marks a session as complete.                          |
| `share_session` | Generates a shareable receipt URL for the session.    |

## Environment variables

| Variable                | Required | Default                   |
| ----------------------- | -------- | ------------------------- |
| `AGENTRECEIPT_API_KEY`  | Yes      | None                      |
| `AGENTRECEIPT_BASE_URL` | No       | `https://agentreceipt.co` |

## Privacy

Event descriptions are sent to agentreceipt.co over HTTPS. The tool instructions tell the agent to never include sensitive data (passwords, API keys, PII, file contents) in descriptions. Only short summaries of actions are logged, not raw payloads. Treat your `AGENTRECEIPT_API_KEY` as a secret and rotate it if you suspect exposure. Review the [privacy policy](https://agentreceipt.co/privacy) for details on data handling.

## Docs

Full documentation at [agentreceipt.co/docs](https://agentreceipt.co/docs).
