import type { Metadata } from "next";
import Link from "next/link";
import { getPlanLimits } from "@/lib/billing";
import { PublicNav } from "@/components/layout/public-nav";

export const metadata: Metadata = {
  description:
    "AgentReceipt captures every action your AI agent takes and stores it as a tamper-proof, human-readable receipt. Built for compliance, audits, and accountability.",
  alternates: {
    canonical: "/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AgentReceipt",
  applicationCategory: "DeveloperApplication",
  description:
    "Immutable audit trails for AI agents. Capture every LLM call, tool call, and decision as a tamper-proof receipt.",
  url: "https://agentreceipt.io",
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
    { "@type": "Offer", price: "29", priceCurrency: "USD", name: "Pro" },
    { "@type": "Offer", price: "99", priceCurrency: "USD", name: "Business" },
  ],
};

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    plan: "free" as const,
    cta: "Start for free",
    href: "/sign-in",
    audience: "For developers testing and building.",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    plan: "pro" as const,
    cta: "Get started",
    href: "/sign-in",
    highlighted: true,
    audience: "For small teams shipping agents in production.",
  },
  {
    name: "Business",
    price: "$99",
    period: "/month",
    plan: "business" as const,
    cta: "Get started",
    href: "/sign-in",
    audience: "For teams running agents across multiple workflows.",
  },
];

const PROBLEMS = [
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    title: "Agents take real actions",
    description:
      "Your AI agents approve expenses, send emails, update records, and trigger payments. These are not suggestions. They are real actions with real consequences.",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    title: "No readable record exists",
    description:
      "When something goes wrong, there is no agent action log a non-technical person can read. No receipt you can hand to your compliance team or your customer.",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    title: "Audits need answers",
    description:
      "Wrong payment to the wrong vendor. An email sent to the wrong customer. Your audit asks what your AI did last Tuesday. You need to be able to answer.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-32 pt-24 sm:pb-40 sm:pt-32">
        {/* Radial gradient glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            width: "800px",
            height: "600px",
            background:
              "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0.03) 40%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-6 text-sm font-medium uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
            AI agent audit trail
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Know exactly what your AI agent did
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Your agents send emails, trigger payments, and modify data.
            AgentReceipt captures every action as a tamper-proof receipt. When
            something goes wrong, you have proof.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-in"
              className="inline-flex w-full items-center justify-center rounded-lg bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/85 sm:w-auto"
            >
              Start for free
            </Link>
            <Link
              href="/demo"
              className="inline-flex w-full items-center justify-center rounded-lg border border-border px-8 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground sm:w-auto"
            >
              See a sample receipt
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof placeholder */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="border-t border-border" />
          <p className="py-8 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
            Trusted by developers building AI agents in production.
          </p>
          <div className="border-t border-border" />
        </div>
      </section>

      {/* Problem */}
      <section className="bg-surface px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
            The problem
          </p>
          <h2 className="mb-16 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Agents act. Nobody knows what they did.
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {PROBLEMS.map((problem) => (
              <div
                key={problem.title}
                className="rounded-xl border border-border bg-card p-7"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {problem.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold">
                  {problem.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {problem.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
            How it works
          </p>
          <h2 className="mb-20 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Three steps. Five minutes.
          </h2>

          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-[21px] top-[44px] bottom-[44px] w-px bg-border" />

            {/* Step 1 */}
            <div className="relative flex gap-6 pb-14">
              <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted font-mono text-sm font-bold text-muted-foreground">
                1
              </div>
              <div className="flex-1 pt-1.5">
                <h3 className="mb-2 text-lg font-semibold">
                  Add three lines of code
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  Install the SDK and wrap your AI client. No config files, no
                  extra infrastructure. Three lines and you have full agent
                  observability, capturing every action automatically.
                </p>
                <div className="overflow-hidden rounded-2xl border border-border bg-[#1e1e2e] shadow-lg">
                  <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-3">
                    <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                    <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                    <span className="ml-3 text-xs text-white/40">agent.ts</span>
                  </div>
                  <pre className="p-6 font-mono text-sm leading-[1.8]">
                    <code>
                      <span className="text-[#c678dd]">import</span>
                      <span className="text-[#cdd6f4]">{" { "}</span>
                      <span className="text-[#e5c07b]">createClient</span>
                      <span className="text-[#cdd6f4]">{" } "}</span>
                      <span className="text-[#c678dd]">from</span>
                      <span className="text-[#98c379]">
                        {' "@agentreceipt/sdk"'}
                      </span>
                      <span className="text-[#cdd6f4]">;</span>
                      {"\n\n"}
                      <span className="text-[#c678dd]">const</span>
                      <span className="text-[#e06c75]"> ar</span>
                      <span className="text-[#cdd6f4]"> = </span>
                      <span className="text-[#61afef]">createClient</span>
                      <span className="text-[#cdd6f4]">{"({ "}</span>
                      <span className="text-[#e06c75]">apiKey</span>
                      <span className="text-[#cdd6f4]">{": "}</span>
                      <span className="text-[#98c379]">{'"ar_..."'}</span>
                      <span className="text-[#cdd6f4]">{" });"}</span>
                      {"\n"}
                      <span className="text-[#c678dd]">const</span>
                      <span className="text-[#e06c75]"> openai</span>
                      <span className="text-[#cdd6f4]"> = </span>
                      <span className="text-[#e06c75]">ar</span>
                      <span className="text-[#cdd6f4]">.</span>
                      <span className="text-[#61afef]">wrapOpenAI</span>
                      <span className="text-[#cdd6f4]">(</span>
                      <span className="text-[#c678dd]">new</span>
                      <span className="text-[#e5c07b]"> OpenAI</span>
                      <span className="text-[#cdd6f4]">(), {"{ "}</span>
                      <span className="text-[#e06c75]">sessionName</span>
                      <span className="text-[#cdd6f4]">{": "}</span>
                      <span className="text-[#98c379]">
                        {'"Process invoice #441"'}
                      </span>
                      <span className="text-[#cdd6f4]">{" });"}</span>
                    </code>
                  </pre>
                </div>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Works with OpenAI, Anthropic, Gemini, Mistral, and the Vercel
                  AI SDK.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex gap-6 pb-14">
              <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted font-mono text-sm font-bold text-muted-foreground">
                2
              </div>
              <div className="flex-1 pt-1.5">
                <h3 className="mb-2 text-lg font-semibold">
                  Your agent runs as usual
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Every LLM call, tool call, and decision is captured
                  automatically as an LLM audit log. Your agent code does not
                  change. If the SDK cannot reach our servers, it fails
                  silently. Your agent keeps running.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex gap-6">
              <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted font-mono text-sm font-bold text-muted-foreground">
                3
              </div>
              <div className="flex-1 pt-1.5">
                <h3 className="mb-2 text-lg font-semibold">View the receipt</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Open the dashboard and see a human-readable timeline of
                  everything your agent did. Each event is hash-chained, giving
                  you tamper-proof AI logs you can share with auditors or
                  customers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="bg-surface px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
            How receipts stay honest
          </p>
          <h2 className="mb-20 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Every receipt is tamper-proof
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Card 1 */}
            <section className="rounded-xl border border-border bg-card p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 12 15 16 10" />
                </svg>
              </div>
              <h3 className="mb-2 text-base font-semibold">
                Tamper-proof by design
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Every event is hash-chained to the one before it. Receipts are
                append-only. Nobody can edit or delete events after the fact.
                Not even you.
              </p>
            </section>

            {/* Card 2 */}
            <section className="rounded-xl border border-border bg-card p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className="mb-2 text-base font-semibold">
                EU AI Act compliance
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Article 19 requires high-risk AI systems to retain logs for at
                least six months. AgentReceipt stores receipts with configurable
                retention and an immutable hash chain. Enforcement starts August
                2026.
              </p>
            </section>

            {/* Card 3 */}
            <section className="rounded-xl border border-border bg-card p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                  aria-hidden="true"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <h3 className="mb-2 text-base font-semibold">US compliance</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                SOC 2 audits ask for activity logs. HIPAA requires six-year
                retention for healthcare data. SOX and SEC rules require
                financial agents to prove they followed execution rules. One
                audit trail covers all of them.
              </p>
            </section>

            {/* Card 4 */}
            <section className="rounded-xl border border-border bg-card p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <polyline points="16 11 18 13 22 9" />
                </svg>
              </div>
              <h3 className="mb-2 text-base font-semibold">
                Human review, captured
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Record approval steps alongside agent actions. When a person
                signs off before the agent proceeds, that decision is part of
                the receipt too.
              </p>
            </section>

            {/* Card 5 */}
            <section className="rounded-xl border border-border bg-card p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                  aria-hidden="true"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3 className="mb-2 text-base font-semibold">PII flagging</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Tag events that contain sensitive data. Mark health records,
                financial data, or personal information so your compliance team
                knows exactly which events to scrutinise.
              </p>
            </section>

            {/* Card 6 */}
            <section className="rounded-xl border border-border bg-card p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                  aria-hidden="true"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 3h-8l-2 4h12l-2-4Z" />
                </svg>
              </div>
              <h3 className="mb-2 text-base font-semibold">
                Works with every major provider
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Wrap OpenAI, Anthropic, Gemini, Mistral, or the Vercel AI SDK
                with one line of code. Switch providers without changing your
                audit setup.
              </p>
            </section>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Pricing
          </p>
          <h2 className="mb-4 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Simple, predictable pricing
          </h2>
          <p className="mx-auto mb-20 max-w-lg text-center text-sm text-muted-foreground">
            Start free. Upgrade when you need more sessions or longer retention.
          </p>
          <div className="grid gap-6 sm:grid-cols-4">
            {PLANS.map((plan) => {
              const limits = getPlanLimits(plan.plan);
              const CheckIcon = () => (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              );
              return (
                <article
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border p-8 ${
                    plan.highlighted
                      ? "border-indigo-400/50 bg-gradient-to-b from-indigo-50 to-card shadow-md ring-1 ring-indigo-400/20 dark:border-indigo-500/40 dark:from-indigo-950/20 dark:to-card dark:shadow-[0_0_40px_-12px_rgba(99,102,241,0.15)] dark:ring-indigo-500/10"
                      : "border-border bg-card"
                  }`}
                >
                  {plan.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-4 py-1 text-xs font-semibold text-white">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plan.audience}
                  </p>
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  </p>
                  <ul className="mt-8 flex-1 space-y-4 text-sm text-muted-foreground">
                    <li className="flex items-center gap-3">
                      <CheckIcon />
                      {limits.sessionsPerMonth.toLocaleString()} sessions/month
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckIcon />
                      {limits.retentionDays} day retention
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckIcon />
                      Hash chain verification
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckIcon />
                      Unlimited projects
                    </li>
                  </ul>
                  <Link
                    href={plan.href}
                    className={`mt-10 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                      plan.highlighted
                        ? "bg-indigo-500 text-white hover:bg-indigo-600"
                        : "border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </article>
              );
            })}

            {/* Enterprise */}
            <article className="relative flex flex-col rounded-2xl border border-border bg-card p-8">
              <h3 className="text-lg font-semibold">Enterprise</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                For regulated industries and large-scale deployments.
              </p>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  Custom
                </span>
              </p>
              <ul className="mt-8 flex-1 space-y-4 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Unlimited sessions
                </li>
                <li className="flex items-center gap-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Custom retention (up to 7 years)
                </li>
                <li className="flex items-center gap-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Hash chain verification
                </li>
                <li className="flex items-center gap-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Unlimited projects
                </li>
              </ul>
              <Link
                href="mailto:sales@agentreceipt.com"
                className="mt-10 block w-full rounded-xl border border-border py-3 text-center text-sm font-semibold text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                Contact sales
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
            FAQ
          </p>
          <h2 className="mb-16 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Common questions
          </h2>
          <dl className="divide-y divide-border">
            <div className="py-6">
              <dt className="text-sm font-semibold text-foreground">
                Will this slow down my agent?
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-muted-foreground">
                No. The SDK sends events asynchronously in batches. If it cannot
                reach our servers, it fails silently. Your agent keeps running
                regardless.
              </dd>
            </div>
            <div className="py-6">
              <dt className="text-sm font-semibold text-foreground">
                Where is my data stored?
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Event metadata is stored in our database. Raw LLM inputs and
                outputs are stored separately in Cloudflare R2. You can request
                deletion of raw payloads at any time to comply with GDPR Article
                17.
              </dd>
            </div>
            <div className="py-6">
              <dt className="text-sm font-semibold text-foreground">
                Who can see my receipts?
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Only members of your workspace. You can invite your compliance
                team, legal counsel, or any other stakeholder directly. They see
                everything you see.
              </dd>
            </div>
            <div className="py-6">
              <dt className="text-sm font-semibold text-foreground">
                What counts as a session?
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-muted-foreground">
                One end-to-end agent run. Processing one invoice, handling one
                support ticket, running one scheduled job. Each session captures
                up to 200 events.
              </dd>
            </div>
            <div className="py-6">
              <dt className="text-sm font-semibold text-foreground">
                Which AI providers does it support?
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-muted-foreground">
                OpenAI, Anthropic, Gemini, Mistral, and the Vercel AI SDK. Each
                takes one line of code to integrate.
              </dd>
            </div>
            <div className="py-6">
              <dt className="text-sm font-semibold text-foreground">
                Do I need to change my agent code?
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-muted-foreground">
                No. You wrap your existing AI client with one line. The rest of
                your code stays exactly as it is.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Your agents are already taking actions.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base text-muted-foreground">
            Start keeping a record of them. Free plan, no credit card, five
            minutes to set up.
          </p>
          <div className="mt-10">
            <Link
              href="/sign-in"
              className="inline-flex rounded-xl bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/85"
            >
              Get started for free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-12 sm:flex-row sm:justify-between">
            <div>
              <span className="text-base font-semibold tracking-tight">
                AgentReceipt
              </span>
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                Immutable audit trails for AI agent actions. AI accountability
                starts with knowing what happened, when, and why.
              </p>
            </div>
            <div className="flex gap-16">
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Product
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>
                    <Link
                      href="/demo"
                      className="transition-colors hover:text-foreground"
                    >
                      Demo
                    </Link>
                  </li>
                  <li>
                    <a
                      href="#pricing"
                      className="transition-colors hover:text-foreground"
                    >
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="transition-colors hover:text-foreground"
                    >
                      Docs
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Company
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>
                    <a
                      href="#"
                      className="transition-colors hover:text-foreground"
                    >
                      GitHub
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/sign-in"
                      className="transition-colors hover:text-foreground"
                    >
                      Sign in
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-16 border-t border-border pt-8">
            <p className="text-xs text-muted-foreground/60">
              &copy; {new Date().getFullYear()} AgentReceipt. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
