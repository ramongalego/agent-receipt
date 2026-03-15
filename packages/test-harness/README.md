# TestLord

Manual test harness for all AgentReceipt SDK wrappers. Runs real API calls against OpenAI, Anthropic, Gemini, Mistral, and Vercel AI SDK, then checks that sessions appear in the AgentReceipt dashboard.

## Setup

```bash
cd packages/test-harness
cp .env.example .env
# Fill in your API keys
npm install
npm run dev
```

Open http://localhost:3002. Make sure the AgentReceipt app is running on localhost:3000.

## What it tests

Each button makes a real API call through the AgentReceipt SDK wrapper and verifies the event is captured. Covers: standard completions, streaming, tool calling, and structured output for each provider.
