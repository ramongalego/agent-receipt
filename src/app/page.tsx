import type { Metadata } from "next";
import Link from "next/link";
import { getPlanLimits } from "@/lib/billing";
import { PublicNav } from "@/components/layout/public-nav";
import { PricingCards } from "@/components/pricing-toggle";

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
  url: "https://agentreceipt.co",
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
    { "@type": "Offer", price: "49", priceCurrency: "USD", name: "Pro" },
    { "@type": "Offer", price: "199", priceCurrency: "USD", name: "Business" },
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
    price: "$49",
    period: "/month",
    plan: "pro" as const,
    cta: "Get started",
    href: "/sign-in",
    highlighted: true,
    audience: "For small teams shipping agents in production.",
    yearlyPrice: "$39",
    yearlyTotal: "$470",
    yearlySavings: "$118",
  },
  {
    name: "Business",
    price: "$199",
    period: "/month",
    plan: "business" as const,
    cta: "Get started",
    href: "/sign-in",
    audience: "For teams running agents across multiple workflows.",
    yearlyPrice: "$159",
    yearlyTotal: "$1,910",
    yearlySavings: "$478",
  },
];

const FAQS = [
  {
    question: "Will this slow down my agent?",
    answer:
      "No. The SDK sends events asynchronously in batches. If it cannot reach our servers, it fails silently. Your agent keeps running regardless.",
  },
  {
    question: "Where is my data stored?",
    answer:
      "Event metadata is stored in our database. Raw LLM inputs and outputs are stored separately in Cloudflare R2. You can request deletion of raw payloads at any time to comply with GDPR Article 17.",
  },
  {
    question: "Who can see my receipts?",
    answer:
      "Only members of your workspace. You can invite your compliance team, legal counsel, or any other stakeholder directly. They see everything you see. You can also generate a shareable link for any receipt and send it to anyone. No login required.",
  },
  {
    question: "What counts as a session?",
    answer:
      "One end-to-end agent run. Processing one invoice, handling one support ticket, running one scheduled job. Each session captures up to 200 events.",
  },
  {
    question: "Which AI providers does it support?",
    answer:
      "OpenAI, Anthropic, Gemini, Mistral, and the Vercel AI SDK. Each takes one line of code to integrate.",
  },
  {
    question: "Do I need to change my agent code?",
    answer:
      "No. You wrap your existing AI client with one line. The rest of your code stays exactly as it is.",
  },
];

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M4 10h12M12 6l4 4-4 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChainArrow() {
  return (
    <svg
      width="18"
      height="12"
      viewBox="0 0 18 12"
      fill="none"
      className="shrink-0 text-muted-foreground"
      aria-hidden="true"
    >
      <path
        d="M0 6h14m0 0L10 2m4 4l-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-32 pt-24 sm:pb-40 sm:pt-28">
        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left: copy */}
            <div className="text-center lg:text-left">
              <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.75rem]">
                Know exactly what your AI agent did
              </h1>
              <p className="mx-auto mt-8 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground lg:mx-0">
                Your agents send emails, trigger payments, and modify data.
                AgentReceipt captures every action as a tamper-proof receipt.
                When something goes wrong, you have proof.
              </p>
              <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                <Link
                  href="/sign-in"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/85 sm:w-auto"
                >
                  Start for free
                </Link>
                <Link
                  href="/demo"
                  className="group inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-8 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground sm:w-auto"
                >
                  See a sample receipt
                  <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Right: receipt artifact */}
            <div className="relative hidden lg:block">
              <div className="relative mx-auto w-full max-w-sm rotate-[1.5deg] transition-transform duration-500 hover:rotate-0">
                {/* Top perforated/zigzag edge */}
                <div
                  aria-hidden="true"
                  className="h-3 w-full bg-card"
                  style={{
                    WebkitMaskImage:
                      "linear-gradient(135deg, transparent 25%, black 25%, black 50%, transparent 50%, transparent 75%, black 75%), linear-gradient(45deg, transparent 25%, black 25%, black 50%, transparent 50%, transparent 75%, black 75%)",
                    maskImage:
                      "linear-gradient(135deg, transparent 25%, black 25%, black 50%, transparent 50%, transparent 75%, black 75%), linear-gradient(45deg, transparent 25%, black 25%, black 50%, transparent 50%, transparent 75%, black 75%)",
                    WebkitMaskSize: "12px 12px",
                    maskSize: "12px 12px",
                    WebkitMaskPosition: "0 -3px",
                    maskPosition: "0 -3px",
                    filter:
                      "drop-shadow(0 -1px 0 rgb(var(--border-rgb, 212 212 220)))",
                  }}
                />

                {/* Paper body */}
                <div className="relative border-x border-border bg-card px-6 pt-5 pb-6 font-mono text-[11.5px] leading-[1.7] text-foreground shadow-[0_12px_30px_-15px_rgba(0,0,0,0.25)]">
                  {/* Masthead */}
                  <div className="text-center">
                    <div className="text-xs font-bold uppercase tracking-[0.3em] text-foreground">
                      AgentReceipt
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      agentreceipt.co · session #A7F3
                    </div>
                  </div>

                  <div className="my-3 border-t border-dashed border-border" />

                  {/* Session meta */}
                  <div className="space-y-0.5 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>PROJECT</span>
                      <span className="text-foreground">invoice-process</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MODEL</span>
                      <span className="text-foreground">gpt-4o</span>
                    </div>
                    <div className="flex justify-between">
                      <span>STARTED</span>
                      <span className="text-foreground">14:02:11 UTC</span>
                    </div>
                  </div>

                  <div className="my-3 border-t border-dashed border-border" />

                  {/* Events, line items */}
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">14:02:14</span>
                      <span className="flex-1 truncate">llm.call gpt-4o</span>
                      <span className="text-emerald-700 dark:text-emerald-400">
                        OK
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">14:02:17</span>
                      <span className="flex-1 truncate">
                        tool stripe.charge
                      </span>
                      <span className="text-foreground">$248.50</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">14:02:19</span>
                      <span className="flex-1 truncate">
                        tool email.send
                        <span className="ml-1 rounded-sm border border-purple-200 bg-purple-50 px-1 py-[1px] text-xs font-medium text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-400">
                          PII
                        </span>
                      </span>
                      <span className="text-foreground">2 rcpts</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">14:02:20</span>
                      <span className="flex-1 truncate">decision route=ok</span>
                      <span className="text-emerald-700 dark:text-emerald-400">
                        OK
                      </span>
                    </div>
                  </div>

                  <div className="my-3 border-t border-dashed border-border" />

                  {/* Totals */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-muted-foreground">
                      <span>EVENTS</span>
                      <span className="text-foreground">4</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>DURATION</span>
                      <span className="text-foreground">9.2s</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>STATUS</span>
                      <span className="text-emerald-700 dark:text-emerald-400">
                        complete
                      </span>
                    </div>
                  </div>

                  <div className="my-3 border-t border-dashed border-border" />

                  {/* Hash footer */}
                  <div className="text-xs text-muted-foreground">
                    <div>HASH c72e…f031</div>
                    <div>PREV b8d0…4a71</div>
                    <div className="mt-2 flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <span
                        aria-hidden="true"
                        className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"
                      />
                      <span>anchored · sigstore rekor</span>
                    </div>
                  </div>

                  {/* Barcode */}
                  <div
                    aria-hidden="true"
                    className="mt-4 flex h-7 items-end justify-center gap-[2px]"
                  >
                    {[
                      3, 5, 2, 6, 3, 4, 2, 5, 3, 6, 2, 4, 5, 3, 6, 2, 4, 3, 5,
                      2, 6, 4, 3, 5, 2, 6, 3, 4,
                    ].map((h, i) => (
                      <span
                        key={i}
                        className="block w-[2px] bg-foreground"
                        style={{ height: `${h * 4}px` }}
                      />
                    ))}
                  </div>
                  <div className="mt-1 text-center text-xs tracking-[0.25em] text-muted-foreground">
                    24296FB2·AD77A
                  </div>
                </div>

                {/* Bottom perforated edge */}
                <div
                  aria-hidden="true"
                  className="h-3 w-full bg-card"
                  style={{
                    WebkitMaskImage:
                      "linear-gradient(45deg, transparent 25%, black 25%, black 50%, transparent 50%, transparent 75%, black 75%), linear-gradient(135deg, transparent 25%, black 25%, black 50%, transparent 50%, transparent 75%, black 75%)",
                    maskImage:
                      "linear-gradient(45deg, transparent 25%, black 25%, black 50%, transparent 50%, transparent 75%, black 75%), linear-gradient(135deg, transparent 25%, black 25%, black 50%, transparent 50%, transparent 75%, black 75%)",
                    WebkitMaskSize: "12px 12px",
                    maskSize: "12px 12px",
                    WebkitMaskPosition: "0 0",
                    maskPosition: "0 0",
                  }}
                />

                {/* VERIFIED stamp, tilted, sits beside the hash footer */}
                <div
                  aria-hidden="true"
                  className="absolute -right-5 bottom-24 -rotate-[10deg] rounded-sm border-2 border-indigo-500/70 bg-background px-3 py-1.5 shadow-md"
                >
                  <div className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                    Verified
                  </div>
                  <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
                    hash-chain · ok
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-surface px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-12 text-balance text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Agents act. Nobody knows what they did.
          </h2>
          <div className="mx-auto max-w-[65ch] space-y-6 text-pretty text-base leading-relaxed text-muted-foreground">
            <p>
              <strong className="font-semibold text-foreground">
                Agents take real actions.
              </strong>{" "}
              Your AI agents approve expenses, send emails, update records, and
              trigger payments. These are not suggestions. They are real actions
              with real consequences.
            </p>
            <p>
              <strong className="font-semibold text-foreground">
                No readable record exists.
              </strong>{" "}
              When something goes wrong, there is no record a non-technical
              person can read. No receipt you can hand to your compliance team
              or your customer.
            </p>
            <p>
              <strong className="font-semibold text-foreground">
                Audits need answers.
              </strong>{" "}
              Wrong payment to the wrong vendor. An email sent to the wrong
              customer. Your audit asks what your AI did last Tuesday. A log of
              what happened is not enough. You need to know what the agent saw
              and what rules it was following when it made the call.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl lg:max-w-4xl">
          <h2 className="mb-20 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Three steps. Five minutes.
          </h2>

          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-[21px] top-[44px] bottom-[44px] w-px bg-border" />

            {/* Step 1 */}
            <div className="relative flex gap-4 sm:gap-6 pb-14">
              <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted font-mono text-sm font-bold text-muted-foreground">
                1
              </div>
              <div className="min-w-0 flex-1 pt-1.5">
                <h3 className="mb-2 text-lg font-semibold">
                  Add three lines of code
                </h3>
                <p className="mb-6 max-w-[65ch] text-pretty text-sm leading-relaxed text-muted-foreground">
                  Install the SDK and wrap your AI client. No config files, no
                  extra infrastructure. Every LLM call is recorded from then on.
                </p>
                <div className="overflow-hidden rounded-2xl border border-border bg-[#1e1e2e] shadow-lg">
                  <div className="border-b border-white/[0.06] px-4 py-3">
                    <span className="text-xs text-white/70">agent.ts</span>
                  </div>
                  <pre className="overflow-x-auto p-4 sm:p-6 font-mono text-xs sm:text-sm leading-[1.8]">
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
            <div className="relative flex gap-4 sm:gap-6 pb-14">
              <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted font-mono text-sm font-bold text-muted-foreground">
                2
              </div>
              <div className="min-w-0 flex-1 pt-1.5">
                <h3 className="mb-2 text-lg font-semibold">
                  Your agent runs as usual
                </h3>
                <p className="mb-6 max-w-[65ch] text-pretty text-sm leading-relaxed text-muted-foreground">
                  Every LLM call, tool call, and decision is captured
                  automatically. Your agent code does not change. If the SDK
                  cannot reach our servers, it fails silently. Your agent keeps
                  running.
                </p>
                {/* Session in progress */}
                <div className="overflow-hidden rounded-xl border border-border bg-background/40">
                  <div className="flex items-center justify-between border-b border-border px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"
                      />
                      <span>Session #A7F3 · capturing</span>
                    </div>
                    <span className="hidden sm:inline">3 events</span>
                  </div>
                  <div className="divide-y divide-border font-mono text-[11.5px]">
                    <div className="flex items-center justify-between px-4 py-2">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>14:02:14</span>
                        <span className="text-foreground">llm.call</span>
                        <span className="hidden sm:inline">gpt-4o</span>
                      </div>
                      <span className="text-emerald-700 dark:text-emerald-400">
                        ok
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>14:02:17</span>
                        <span className="text-foreground">tool.call</span>
                        <span className="hidden sm:inline">stripe.charge</span>
                      </div>
                      <span className="text-emerald-700 dark:text-emerald-400">
                        ok
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-indigo-500/[0.04] px-4 py-2">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>14:02:19</span>
                        <span className="text-foreground">tool.call</span>
                        <span className="hidden sm:inline">email.send</span>
                      </div>
                      <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                        <span
                          aria-hidden="true"
                          className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500"
                        />
                        writing
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex gap-4 sm:gap-6">
              <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted font-mono text-sm font-bold text-muted-foreground">
                3
              </div>
              <div className="min-w-0 flex-1 pt-1.5">
                <h3 className="mb-2 text-lg font-semibold">View the receipt</h3>
                <p className="mb-6 max-w-[65ch] text-pretty text-sm leading-relaxed text-muted-foreground">
                  Open the dashboard and see a human-readable timeline of
                  everything your agent did. Each receipt shows the full
                  decision context: the rules, permissions, and state your agent
                  was operating under when it acted. Every event is hash-chained
                  for tamper-proof verification. Share any receipt with a
                  one-click link.
                </p>
                {/* Receipt preview */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                        <span>Receipt</span>
                        <span aria-hidden="true">·</span>
                        <span>A7F3</span>
                        <span aria-hidden="true">·</span>
                        <span>14:02 UTC</span>
                      </div>
                      <p className="mt-2 truncate text-sm font-semibold">
                        Process invoice #441
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        4 events · 9.2s · complete
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckIcon />
                      Verified
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-3 font-mono text-xs text-muted-foreground">
                    <span>hash c72e…f031</span>
                    <span className="hidden sm:inline">
                      anchored · sigstore
                    </span>
                    <span>share link</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="bg-surface px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-20 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            How receipts stay honest
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Featured, hash chain (span 2) */}
            <section className="rounded-2xl border border-border bg-card p-8 transition-colors hover:border-foreground/20 md:col-span-2">
              <h3 className="mb-2 text-lg font-semibold">
                Hash-chained events
              </h3>
              <p className="mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                Every event is hash-chained to the one before it. Receipts are
                append-only. Nobody can edit or delete events after the fact.
                Not even you.
              </p>
              {/* Hash chain diagram */}
              <div className="flex items-center gap-3 overflow-x-auto font-mono text-xs">
                <div className="shrink-0 text-muted-foreground">
                  <div>event[0]</div>
                  <div className="text-foreground">a1f3…9e2c</div>
                </div>
                <ChainArrow />
                <div className="shrink-0 text-muted-foreground">
                  <div>event[1]</div>
                  <div className="text-foreground">b8d0…4a71</div>
                </div>
                <ChainArrow />
                <div className="shrink-0 text-indigo-700 dark:text-indigo-300">
                  <div>event[2]</div>
                  <div>c72e…f031</div>
                </div>
              </div>
            </section>

            {/* EU AI Act */}
            <section className="rounded-2xl border border-border bg-card p-8 transition-colors hover:border-foreground/20">
              <h3 className="mb-2 text-base font-semibold">
                EU AI Act compliance
              </h3>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                Article 19 requires high-risk AI systems to retain logs for at
                least six months. AgentReceipt stores receipts with configurable
                retention and an immutable hash chain. The rule applies to
                stand-alone high-risk systems from 2 December 2027.
              </p>
            </section>

            {/* US compliance */}
            <section className="rounded-2xl border border-border bg-card p-8 transition-colors hover:border-foreground/20">
              <div className="mb-4 flex flex-wrap gap-1.5 font-mono text-xs font-semibold text-foreground">
                <span className="rounded bg-muted px-2 py-1">SOC 2</span>
                <span className="rounded bg-muted px-2 py-1">HIPAA</span>
                <span className="rounded bg-muted px-2 py-1">SOX</span>
                <span className="rounded bg-muted px-2 py-1">SEC</span>
              </div>
              <h3 className="mb-2 text-base font-semibold">US compliance</h3>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                SOC 2 audits ask for activity logs. HIPAA requires six-year
                retention for healthcare data. SOX and SEC rules require
                financial agents to prove they followed execution rules.
              </p>
            </section>

            {/* Human review */}
            <section className="rounded-2xl border border-border bg-card p-8 transition-colors hover:border-foreground/20">
              <h3 className="mb-2 text-base font-semibold">
                Human review, captured
              </h3>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                Record approval steps alongside agent actions. When a person
                signs off before the agent proceeds, that decision is part of
                the receipt too.
              </p>
            </section>

            {/* PII flagging */}
            <section className="rounded-2xl border border-border bg-card p-8 transition-colors hover:border-foreground/20">
              <div className="mb-4 flex flex-wrap gap-1.5 font-mono text-xs">
                <span className="rounded border border-purple-200 bg-purple-50 px-2 py-1 text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-400">
                  [PII]
                </span>
                <span className="rounded border border-purple-200 bg-purple-50 px-2 py-1 text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-400">
                  [HEALTH]
                </span>
                <span className="rounded border border-purple-200 bg-purple-50 px-2 py-1 text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-400">
                  [FINANCIAL]
                </span>
              </div>
              <h3 className="mb-2 text-base font-semibold">PII flagging</h3>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                Tag events that contain sensitive data. Mark health records,
                financial data, or personal information so your compliance team
                knows exactly which events to scrutinise.
              </p>
            </section>

            {/* Featured, Sigstore (span 3) */}
            <section className="rounded-2xl border border-border bg-card p-8 transition-colors hover:border-foreground/20 md:col-span-3">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="mb-2 text-base font-semibold">
                    Anchored on a public log
                  </h3>
                  <p className="max-w-[65ch] text-pretty text-sm leading-relaxed text-muted-foreground">
                    Pro and Business receipts are anchored to the Sigstore Rekor
                    transparency log after every session. This is a public,
                    permanent record that proves the receipt existed at a
                    specific time and has not been changed. Anyone can verify it
                    independently.
                  </p>
                </div>
                {/* Same badge the receipt page shows */}
                <div className="flex shrink-0 items-center gap-2 self-start rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950/30">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-600 dark:text-green-400"
                    aria-hidden="true"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 12 15 16 10" />
                  </svg>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Anchored on Rekor
                  </span>
                  <span className="font-mono text-xs text-green-700 dark:text-green-300">
                    log index 142893041
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Flat monthly pricing. No per-seat fees.
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-center text-sm text-muted-foreground">
            Upgrade when you need more sessions or longer retention.
          </p>
          <PricingCards
            plans={PLANS.map((plan) => ({
              ...plan,
              sessionsPerMonth: getPlanLimits(plan.plan).sessionsPerMonth,
              retentionDays: getPlanLimits(plan.plan).retentionDays,
            }))}
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Common questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-border bg-card transition-colors hover:border-foreground/20 open:border-foreground/20"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
                  <span className="text-sm font-semibold text-foreground">
                    {faq.question}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-transform duration-300 group-open:rotate-180 group-open:border-foreground/30 group-open:text-foreground">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </summary>
                <p className="max-w-[65ch] px-6 pb-6 text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl">
            Your agents are already taking actions.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base text-muted-foreground">
            Start keeping a record of them. Free plan, no credit card, five
            minutes to set up.
          </p>
          <div className="mt-10">
            <Link
              href="/sign-in"
              className="group inline-flex items-center gap-2 rounded-lg bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/85"
            >
              Start for free
              <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
                Immutable audit trails for AI agent actions.
              </p>
            </div>
            <div className="flex gap-16">
              <div>
                <p className="mb-4 text-sm font-semibold text-foreground">
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
                    <Link
                      href="/docs"
                      className="transition-colors hover:text-foreground"
                    >
                      Docs
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="mb-4 text-sm font-semibold text-foreground">
                  Company
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>
                    <Link
                      href="/sign-in"
                      className="transition-colors hover:text-foreground"
                    >
                      Sign in
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacy"
                      className="transition-colors hover:text-foreground"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="transition-colors hover:text-foreground"
                    >
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-16 border-t border-border pt-8">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} AgentReceipt. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
