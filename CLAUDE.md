# AgentReceipt — Claude Code Instructions

## What this is

AgentReceipt is a developer tool that captures and stores immutable audit trails of AI agent actions. Companies building agents that take real-world actions (sending emails, triggering payments, modifying data) use it to prove what their agent did, when, and why.

The product has two parts:

- A **web dashboard** (this repo) — where users view receipts, manage projects, and configure alerts
- An **SDK** (separate package) — a TypeScript library developers drop into their agent code

---

## Current state (scaffolded)

The following already exists and must not be re-created:

```
src/
  app/
    api/auth/[...nextauth]/route.ts
    dashboard/                          # Protected dashboard (projects list)
    sign-in/                            # Sign-in page (GitHub, Google, magic link)
    layout.tsx, page.tsx, globals.css
  db/
    index.ts                            # Drizzle + Neon client
    schema.ts                           # users, accounts, sessions, projects, apiKeys, agentSessions, events
    queries/
      projects.ts
      sessions.ts
      events.ts
  lib/
    auth.ts                             # Auth.js v5 config
    hash.ts                             # SHA-256 hashing + chain verification
    api-key.ts                          # API key generation (ar_ prefix) + hashing
    result.ts                           # Result<T, E> pattern
```

CI is green. All 16 tests pass. Do not break this.

---

## Tech stack

- **Framework:** Next.js 15 (App Router, strict TypeScript)
- **Database:** PostgreSQL via Neon + Drizzle ORM
- **Auth:** Auth.js v5 (GitHub + Google + magic link) + API key table for SDK auth
- **Email:** Resend
- **Payments:** Stripe (subscriptions)
- **Storage:** Cloudflare R2 (raw LLM payload storage)
- **Styles:** Tailwind CSS — no shadcn, no component libraries, custom components only
- **Deployed on:** Vercel
- **Tests:** Jest + React Testing Library

---

## Coding principles

### General

- Follow YAGNI. Build what is needed now, not what might be needed later.
- No premature abstractions. If something is only used once, do not abstract it.
- No over-engineering. If a plain function solves it, do not reach for a pattern.
- DRY matters, but only for real duplication, not speculative reuse.
- Small, focused functions. One job per function.
- Explicit over implicit. Name things clearly.
- Colocate related files. Feature folders over layer folders where it makes sense.

### TypeScript

- Strict mode always on.
- No `any`. Use `unknown` and narrow it.
- Prefer `type` over `interface` unless you need declaration merging.
- Zod for all external input validation (API routes, form data, SDK payloads).
- Derive types from Zod schemas and Drizzle schema. Do not duplicate type definitions.

### Next.js

- Server Components by default. Only add `"use client"` when genuinely needed (interactivity, browser APIs).
- Fetch data in Server Components or Server Actions. No client-side fetching unless realtime.
- API routes only for: SDK ingest endpoint, Stripe webhooks, Auth.js.
- Use `next/image` for all images. Never raw `<img>` tags.
- Keep route handlers thin. Business logic lives in `/lib`, not in route files.
- Use `loading.tsx` and `error.tsx` for every dashboard route segment.

### Database (Drizzle + Neon)

- Schema lives in `/db/schema.ts`.
- Migrations via `drizzle-kit generate` then `drizzle-kit migrate`. Never mutate the DB manually.
- The `events` table is append-only. Postgres rules already enforce this. Never remove them.
- Queries live in `/db/queries/`. One file per domain.
- No raw SQL unless Drizzle cannot express it. Add a comment explaining why if you do.

### Error handling

- Always handle errors explicitly. No silent catch blocks.
- Use the existing `Result<T, E>` pattern from `lib/result.ts` for functions that can fail predictably.
- API routes return consistent shapes:
  - Success: `{ data: T }`
  - Error: `{ error: string, code: string }`
- HTTP status codes must be semantically correct (401 not 400 for auth failures, etc).

---

## Build order

Build features in this order. Do not skip ahead. Each phase must have passing CI before starting the next.

---

### Phase 1: Projects (core CRUD)

The dashboard already has a projects list page. Build out the full project management flow.

**`/dashboard` — projects list**

- List all projects for the signed-in user
- Each project card shows: name, creation date, session count, API key status (exists or not)
- "Create project" button opens a form (inline or modal, your choice)
- Empty state: clear message explaining what a project is and a prompt to create one

**`/dashboard/projects/new` — create project**

- Form fields: name (required), description (optional)
- On submit: create project row, redirect to the new project's page
- Validate with Zod server-side

**`/dashboard/projects/[projectId]` — project detail**

- Shows project name, description, creation date
- API keys section (see below)
- Recent sessions list (last 10, link to full list)
- "Delete project" button with confirmation (deletes project and cascades)

**`/dashboard/projects/[projectId]/settings` — project settings**

- Edit name and description
- Danger zone: delete project

**API keys UI (within project detail page)**

- Show existing keys: prefix only (e.g. `ar_live_abc123...`), creation date, last used date
- "Create API key" button: generates key, shows the full key ONCE in a modal with a copy button and a warning that it will not be shown again
- "Revoke" button per key with confirmation

**Queries to add (`/db/queries/projects.ts`):**

- `createProject(userId, name, description)`
- `getProjectsByUser(userId)`
- `getProjectById(projectId, userId)` — always scope to userId
- `updateProject(projectId, userId, data)`
- `deleteProject(projectId, userId)`

**Queries to add (`/db/queries/apiKeys.ts`):**

- `createApiKey(projectId, name)` — generates key via `lib/api-key.ts`, stores hash only
- `getApiKeysByProject(projectId)`
- `revokeApiKey(keyId, projectId)`
- `updateApiKeyLastUsed(keyId)`

**Tests to write:**

- `lib/api-key.ts` — key generation format, hashing, prefix validation (already has some, extend)
- `db/queries/projects.ts` — mock DB, test scoping to userId prevents cross-user access
- Project creation form — submits correctly, shows errors on invalid input

---

### Phase 2: SDK ingest endpoint

This is the API that the TypeScript SDK calls. It receives events from agent runs and stores them.

**`POST /api/ingest`**

Authentication: API key in `Authorization: Bearer ar_live_xxx` header.

Request body (Zod schema):

```typescript
{
  sessionId: string          // UUID — created by SDK, groups events into one agent run
  sessionName?: string       // Human label, e.g. "Process invoice #441"
  event: {
    type: "llm_call" | "tool_call" | "decision" | "error"
    name: string             // e.g. "gpt-4o", "send-email", "approve-payment"
    input: unknown           // Raw input — stored in R2, not Postgres
    output: unknown          // Raw output — stored in R2, not Postgres
    durationMs: number
    metadata?: Record<string, unknown>
  }
}
```

**What the endpoint does:**

1. Validate API key against `apiKeys` table (check hash match, check not revoked)
2. Validate request body with Zod
3. Upsert `agentSessions` row (create if sessionId is new, update `lastEventAt` if existing)
4. Compute event hash: `hash(eventData + previousEventHash)` using `lib/hash.ts`
5. Store raw `input` and `output` in Cloudflare R2 (key: `events/{eventId}/payload.json`)
6. Insert event row into `events` table (without raw input/output, just the R2 key)
7. Update API key `lastUsedAt`
8. Return `{ data: { eventId, sessionId } }`

**R2 setup (`lib/r2.ts`):**

- Use `@aws-sdk/client-s3` with R2 credentials from env vars
- `putPayload(eventId, data)` — upload JSON to R2
- `getPayload(eventId)` — download and parse JSON from R2
- Both return `Result<T, Error>`

**Env vars needed:**

```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

**Tests to write:**

- Valid request with correct API key stores event and returns eventId
- Invalid API key returns 401
- Revoked API key returns 401
- Malformed body returns 400 with field errors
- Hash chain: second event's `previousHash` equals first event's `hash`
- R2 upload is called with correct key and payload

---

### Phase 3: Sessions and events UI

**`/dashboard/projects/[projectId]/sessions` — sessions list**

- Table of agent sessions: name, start time, duration, event count, status
- Status rules:
  - "running" — last event was less than 5 minutes ago
  - "error" — any event with `type: "error"` exists
  - "complete" — last event was more than 5 minutes ago, no errors
- Pagination: 20 per page
- Each row links to the session detail page

**`/dashboard/projects/[projectId]/sessions/[sessionId]` — session detail (the receipt)**

This is the most important page. It shows:

**Header:**

- Session name (or sessionId if no name given)
- Project name
- Start time, end time, total duration
- Status badge
- Hash chain integrity indicator: "Verified" or "Tampered" — run chain verification on load

**Timeline:**

- Chronological list of events
- Each event shows: type badge, event name, duration, timestamp, expand button
- Expanding an event fetches the payload from R2 and renders input/output as formatted JSON
- Do not load all payloads on page load. Fetch on demand only.
- Error events are visually distinct (red border or background)

**Receipt summary:**

- Auto-generated plain-English summary of what the agent did
- Single Claude API call: send event names and types only (not raw payloads), ask for a 3-5 sentence plain-English summary
- Cache the result in `agentSessions.summary` column after first generation
- Show a "Regenerate" button

**Queries to add (`/db/queries/sessions.ts`):**

- `getSessionsByProject(projectId, page, limit)`
- `getSessionById(sessionId, projectId)`
- `getEventsBySession(sessionId)` — returns events without payload (R2 key only)
- `updateSessionSummary(sessionId, summary)`

**Tests to write:**

- Hash chain verification passes for a valid unmodified chain
- Hash chain verification fails if any event hash is altered
- Session status logic returns correct status for each scenario
- Summary is not regenerated if it already exists in the DB

---

### Phase 4: Stripe billing

**Plans:**

| Plan     | Price     | Sessions/month | Retention |
| -------- | --------- | -------------- | --------- |
| Free     | $0        | 100            | 7 days    |
| Pro      | $29/month | 5,000          | 90 days   |
| Business | $99/month | 50,000         | 1 year    |

**`/dashboard/billing` — billing page**

- Current plan name and price
- Usage this month: sessions used vs limit (progress bar)
- "Upgrade" button for Free users
- "Manage billing" button for paid users (Stripe Customer Portal link)

**`POST /api/stripe/checkout` — create Stripe Checkout session**

- Accepts `{ priceId }` in body
- Creates or retrieves Stripe customer for the signed-in user
- Returns Checkout session URL, redirect client-side

**`POST /api/stripe/webhook` — handle Stripe events**

- Handle: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- On create/update: set `users.plan` and `users.stripeCustomerId`
- On deleted: downgrade `users.plan` to "free"
- Always verify Stripe signature before processing

**`lib/billing.ts`:**

- `getPlanLimits(plan)` — returns `{ sessionsPerMonth, retentionDays }`
- `getUsageThisMonth(userId)` — count sessions since start of billing period
- `isOverLimit(userId)` — returns boolean

**Enforcement in ingest endpoint:**

- After API key validation, check `isOverLimit`
- If over limit, return 429: `{ error: "Monthly session limit reached. Upgrade your plan.", code: "LIMIT_REACHED" }`
- After body validation, check session event count against `MAX_EVENTS_PER_SESSION` (200, defined in `lib/billing.ts`)
- If the session already has >= 200 events, return 429: `{ error: "Session event limit reached (200). Start a new session.", code: "SESSION_EVENT_LIMIT" }`
- This prevents unbounded event growth within a single session, which would otherwise allow a single session to generate disproportionate R2 storage and DB costs regardless of the plan's session limit

**Tests to write:**

- Webhook: subscription created sets correct plan on user
- Webhook: subscription deleted downgrades to free
- Webhook: invalid signature returns 400
- Usage: 429 returned when over limit
- Usage: request succeeds when under limit
- `getPlanLimits` returns correct values for each plan

---

### Phase 5: TypeScript SDK

The SDK lives at `/packages/sdk-ts/` — a standalone npm package, not a Next.js app.

**Structure:**

```
packages/sdk-ts/
  src/
    index.ts          # Public exports only
    client.ts         # createClient factory function
    session.ts        # createSession factory function
    wrappers/
      openai.ts       # OpenAI client wrapper
      anthropic.ts    # Anthropic client wrapper
    ingest.ts         # HTTP calls to /api/ingest
    types.ts          # SDK-specific types
  package.json
  tsconfig.json
  README.md
```

**`createClient` (`client.ts`):**

```typescript
type ClientOptions = { apiKey: string; baseUrl?: string };

type WrapperOptions = { sessionName?: string };

type VercelAIFunctions = {
  generateText?: (...args: unknown[]) => Promise<unknown>;
  streamText?: (...args: unknown[]) => Promise<unknown>;
  generateObject?: (...args: unknown[]) => Promise<unknown>;
  streamObject?: (...args: unknown[]) => Promise<unknown>;
};

type Client = {
  startSession: (name?: string) => Session;
  wrapOpenAI: <T>(client: T, options?: WrapperOptions) => T;
  wrapAnthropic: <T>(client: T, options?: WrapperOptions) => T;
  wrapVercelAI: <T extends VercelAIFunctions>(
    fns: T,
    options?: WrapperOptions,
  ) => T;
  wrapGemini: <T>(client: T, options?: WrapperOptions) => T;
  track: (
    sessionId: string,
    event: TrackEventInput,
  ) => Promise<Result<string, Error>>;
};

function createClient(options: ClientOptions): Client;
```

**`createSession` (`session.ts`):**

```typescript
type Session = {
  readonly id: string;
  readonly name?: string;
  trackTool: (
    name: string,
    input: unknown,
    fn: () => Promise<unknown>,
  ) => Promise<unknown>;
  trackDecision: (
    name: string,
    reasoning: string,
    outcome: string,
  ) => Promise<void>;
  end: () => Promise<void>;
};

function createSession(name: string | undefined, ingest: IngestFn): Session;
```

Session state (current event queue, session ID, etc.) lives in closures — no `this`, no classes.

**Wrapper rules:**

- Intercept every LLM call including streaming
- For streaming: buffer chunks, reconstruct full response, then send one event
- Capture: model name, input messages, output, token usage, duration
- Never throw. If ingest fails, log a warning and continue. The agent must not break.
- Batch events: flush every 2 seconds or when 10 events are queued (whichever comes first)

**SDK `README.md` must include:**

- Install: `npm install @agentreceipt/sdk`
- Quickstart with OpenAI (5 lines of code)
- Quickstart with Anthropic (5 lines of code)
- Manual tracking example
- Environment variable: `AGENTRECEIPT_API_KEY`

**Tests to write:**

- Session generates a valid UUID on creation
- `trackTool` calls the wrapped function and returns its result unchanged
- `trackTool` sends event even if ingest API returns a non-200 response
- `trackTool` does not throw if ingest API is unreachable
- Streaming response is reconstructed into one event, not many
- Events are batched, not sent one by one

---

### Phase 6: Landing page

**`/` — public landing page**

**Sections:**

**Hero:**

- Headline: "Know exactly what your AI agent did"
- Subheading: 2 sentences max. Plain language. Explain the problem, not the solution.
- Two CTAs: "Start for free" (links to sign-in) and "See a sample receipt" (links to `/demo`)

**Problem section:**

- 3 short paragraphs. No bullet points.
- The problem: agents are taking real actions, nobody can see what they actually did, and that matters when something goes wrong.

**How it works:**

- 3 steps
- Step 1: Install the SDK and add 3 lines of code (show a small code snippet)
- Step 2: Your agent runs. Every action is captured automatically.
- Step 3: View a human-readable receipt. Share it or export it.

**Pricing section:**

- 3 plan cards (Free, Pro, Business) matching the Stripe plans
- CTA on each card

**Footer:**

- Links: Docs (placeholder `#`), GitHub (placeholder `#`), Sign in
- No social links yet

**Design rules:**

- Dark background — something like `#0a0a0f`, not pure black
- Monospace font for code snippets
- No stock photos, no illustrations unless they are simple inline SVGs you write yourself
- No animations on first load. Subtle hover transitions only.
- Mobile responsive. Must work at 375px, 768px, and 1280px.

---

### Phase 7: Demo receipt page

**`/demo` — static example receipt, no auth required**

A hardcoded page showing what a receipt looks like. Use this scenario: an accounts payable agent that processed an invoice.

Hardcoded events to show:

1. `llm_call` "Parse invoice" — input: invoice text, output: structured JSON
2. `tool_call` "Look up vendor" — input: vendor name, output: vendor record from DB
3. `decision` "Approve payment" — reasoning: amount within tolerance and vendor verified
4. `tool_call` "Trigger payment" — input: payment details, output: payment confirmation

Render the full receipt UI (timeline, summary, "Hash chain verified" badge) with this static data.
This page is linked from the landing page hero. No sign-in required.

---

## Component guidelines

Build components as you need them. Do not build them upfront.

**`components/ui/button.tsx`**

- Variants: `primary`, `secondary`, `danger`, `ghost`
- Sizes: `sm`, `md`, `lg`
- Loading state with spinner
- Disabled state

**`components/ui/badge.tsx`**

- Variants: `default`, `success`, `error`, `warning`, `info`
- Used for session status, event type labels, plan names

**`components/ui/card.tsx`**

- Simple wrapper with border, padding, optional header slot

**`components/ui/empty-state.tsx`**

- Icon slot, title, description, optional CTA button
- Used on every list page when there is no data

**`components/ui/copy-button.tsx`**

- Copies text to clipboard
- Shows "Copied" for 2 seconds then resets
- Used for API keys

**`components/layout/dashboard-layout.tsx`**

- Sidebar with nav: Projects, Billing, Settings
- User avatar and sign-out at the bottom of the sidebar
- Mobile: hamburger/drawer

**Rules for all components:**

- Named exports only. No default exports from component files.
- Props type defined above the component in the same file. Not in a separate types file.
- No `React.FC`. Plain function with typed props.

---

## Copy and writing rules

These apply to every string in the codebase: UI labels, error messages, email subjects, code comments.

- No em dashes anywhere. Use a comma, a full stop, or rewrite the sentence.
- Short sentences. If a sentence has more than two clauses, split it.
- Plain language. Write like a person.
- Banned words: "leverage", "streamline", "empower", "cutting-edge", "robust", "comprehensive", "foster", "harness", "spearheading", "groundbreaking", "paradigm", "synergy".
- If a sentence sounds like a LinkedIn post, rewrite it.
- Error messages say what happened and what to do next. Not "An error occurred."
- Button labels are actions. "Create project", "Copy API key", "View receipt". Not "Submit".

---

## Domain language

Use these terms consistently everywhere:

| Term        | Meaning                                                          |
| ----------- | ---------------------------------------------------------------- |
| **Session** | One end-to-end agent run (e.g. "process invoice #441")           |
| **Event**   | A single action within a session (LLM call, tool call, decision) |
| **Receipt** | The human-readable summary of a completed session                |
| **Project** | A customer's agent app registered in AgentReceipt                |
| **API key** | The key a project uses to authenticate SDK ingest calls          |

---

## Testing rules

- Jest + React Testing Library only.
- Test business logic and critical user flows. Not implementation details.
- No snapshot tests.
- Test files colocated with the module they test.
- Mock external services (Neon, R2, Stripe, Resend) at the module boundary. Never hit real services in tests.
- Test names should read like documentation.

---

## CI — every change must pass before finishing

```bash
npm run lint          # ESLint
npm run type-check    # tsc --noEmit
npm run test          # Jest
npm run format:check  # Prettier
```

Fix all failures. Do not leave warnings. Do not skip checks.

---

## Environment variables

All env vars must exist in `.env.example` with placeholder values and a one-line comment.

```bash
# Database
DATABASE_URL=             # Neon connection string

# Auth
AUTH_SECRET=              # Auth.js secret — generate with: openssl rand -base64 32
AUTH_GITHUB_ID=           # GitHub OAuth app client ID
AUTH_GITHUB_SECRET=       # GitHub OAuth app client secret
AUTH_GOOGLE_ID=           # Google OAuth client ID
AUTH_GOOGLE_SECRET=       # Google OAuth client secret

# Email
RESEND_API_KEY=           # Resend API key
EMAIL_FROM=               # Sending address e.g. noreply@agentreceipt.com

# Payments
STRIPE_SECRET_KEY=        # Stripe secret key (sk_live_ or sk_test_)
STRIPE_WEBHOOK_SECRET=    # Stripe webhook signing secret (whsec_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Stripe publishable key (pk_live_ or pk_test_)

# Storage
R2_ACCOUNT_ID=            # Cloudflare account ID
R2_ACCESS_KEY_ID=         # R2 access key ID
R2_SECRET_ACCESS_KEY=     # R2 secret access key
R2_BUCKET_NAME=           # R2 bucket name

# App
NEXT_PUBLIC_APP_URL=      # Full URL e.g. https://agentreceipt.com
```

---

## What not to build yet

- Python SDK (TypeScript SDK ships first)
- Hash chain anchoring to Sigstore or any external transparency log
- ClickHouse (Neon handles current scale)
- Redis or QStash (add only if ingest volume requires it)
- Multi-user team workspaces
- Public receipt sharing via link
- Mobile app
- Docs site
