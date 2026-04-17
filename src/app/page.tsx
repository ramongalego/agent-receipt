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
        {/* Dot grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(99, 102, 241, 0.35) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse 65% 50% at 50% 0%, black 20%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 65% 50% at 50% 0%, black 20%, transparent 100%)",
          }}
        />
        {/* Radial gradient glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 animate-[heroGlow_7s_ease-in-out_infinite]"
          style={{
            width: "900px",
            height: "620px",
            background:
              "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.22) 0%, rgba(99, 102, 241, 0.08) 40%, transparent 70%)",
          }}
        />
        {/* Corner annotation marks */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-20 hidden justify-between px-6 text-muted-foreground/25 sm:flex"
        >
          <div className="h-7 w-7 border-l border-t border-current" />
          <div className="h-7 w-7 border-r border-t border-current" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left: copy */}
            <div className="text-center lg:text-left">
              <p className="mb-6 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                <span
                  aria-hidden="true"
                  className="h-px w-8 bg-indigo-500/60"
                />
                AI agent audit trail
              </p>
              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.75rem]">
                Know exactly what your{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">AI agent</span>
                  <svg
                    className="absolute -bottom-2 left-0 z-0 h-3 w-full overflow-visible text-indigo-500"
                    viewBox="0 0 200 12"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8 Q 50 2, 100 6 T 197 5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{" "}
                did
              </h1>
              <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
                Your agents send emails, trigger payments, and modify data.
                AgentReceipt captures every action as a tamper-proof receipt.
                When something goes wrong, you have proof.
              </p>
              <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                <Link
                  href="/sign-in"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-all hover:bg-foreground/85 hover:shadow-[0_0_0_4px_rgba(99,102,241,0.18)] sm:w-auto"
                >
                  Start for free
                </Link>
                <Link
                  href="/demo"
                  className="group inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-8 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground sm:w-auto"
                >
                  See a sample receipt
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </Link>
              </div>
            </div>

            {/* Right: receipt artifact */}
            <div className="relative hidden lg:block">
              {/* Soft indigo halo */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-10 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.18),transparent_65%)]"
              />

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
                <div className="relative border-x border-border bg-card px-6 pt-5 pb-6 font-mono text-[11.5px] leading-[1.7] text-foreground shadow-[0_30px_60px_-20px_rgba(99,102,241,0.25),0_12px_30px_-15px_rgba(0,0,0,0.25)]">
                  {/* Masthead */}
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground">
                      AgentReceipt
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      agentreceipt.co · session #A7F3
                    </div>
                  </div>

                  <div className="my-3 border-t border-dashed border-border" />

                  {/* Session meta */}
                  <div className="space-y-0.5 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>WORKFLOW</span>
                      <span className="text-foreground">invoice-process</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AGENT</span>
                      <span className="text-foreground">gpt-4o</span>
                    </div>
                    <div className="flex justify-between">
                      <span>STARTED</span>
                      <span className="text-foreground">14:02:11 UTC</span>
                    </div>
                  </div>

                  <div className="my-3 border-t border-dashed border-border" />

                  {/* Events — line items */}
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground/70">14:02:14</span>
                      <span className="flex-1 truncate">llm.call gpt-4o</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        OK
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground/70">14:02:17</span>
                      <span className="flex-1 truncate">
                        tool stripe.charge
                      </span>
                      <span className="text-foreground">$248.50</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground/70">14:02:19</span>
                      <span className="flex-1 truncate">
                        tool email.send
                        <span className="ml-1 rounded-sm bg-amber-500/15 px-1 py-[1px] text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          PII
                        </span>
                      </span>
                      <span className="text-foreground">2 rcpts</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground/70">14:02:20</span>
                      <span className="flex-1 truncate">decision route=ok</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
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
                      <span>EXIT</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        0
                      </span>
                    </div>
                  </div>

                  <div className="my-3 border-t border-dashed border-border" />

                  {/* Hash footer */}
                  <div className="text-[10px] text-muted-foreground">
                    <div>HASH c72e…f031</div>
                    <div>PREV b8d0…4a71</div>
                    <div className="mt-2 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      <span>anchored · sigstore rekor</span>
                    </div>
                  </div>

                  {/* Barcode */}
                  <div className="mt-4 flex h-7 items-end justify-center gap-[2px]">
                    {[3, 5, 2, 6, 3, 4, 2, 5, 3, 6, 2, 4, 5, 3, 6, 2, 4, 3, 5, 2, 6, 4, 3, 5, 2, 6, 3, 4].map(
                      (h, i) => (
                        <span
                          key={i}
                          className="block w-[2px] bg-foreground"
                          style={{ height: `${h * 4}px` }}
                        />
                      )
                    )}
                  </div>
                  <div className="mt-1 text-center text-[10px] tracking-[0.25em] text-muted-foreground">
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

                {/* VERIFIED stamp — tilted */}
                <div
                  aria-hidden="true"
                  className="absolute -right-5 top-36 -rotate-[10deg] rounded-sm border-2 border-indigo-500/70 bg-background/95 px-3 py-1.5 shadow-md"
                >
                  <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                    Verified
                  </div>
                  <div className="font-mono text-[8px] uppercase tracking-wider text-indigo-600/70 dark:text-indigo-400/70">
                    hash-chain · ok
                  </div>
                </div>

                {/* Hand-drawn margin annotation with arrow */}
                <div
                  aria-hidden="true"
                  className="absolute -left-6 top-24 w-32 -rotate-[4deg] text-left"
                >
                  <svg
                    viewBox="0 0 140 40"
                    className="h-6 w-24 text-indigo-500/80"
                    fill="none"
                  >
                    <path
                      d="M 4 4 C 50 12, 100 18, 134 34"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 126 28 L 134 34 L 126 38"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-indigo-600/90 dark:text-indigo-400/80">
                    every action
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-indigo-600/90 dark:text-indigo-400/80">
                    captured
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem — framed as an incident log */}
      <section className="bg-surface px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center justify-center gap-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <span aria-hidden="true" className="h-px w-8 bg-border" />
            The problem
            <span aria-hidden="true" className="h-px w-8 bg-border" />
          </div>
          <h2 className="mb-4 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Agents act. Nobody knows what they did.
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-sm text-muted-foreground">
            Today, most AI agent deployments look like this. Actions happen,
            and nobody can prove what actually ran.
          </p>

          {/* Incident log header strip — echoes the hero receipt's masthead */}
          <div className="relative mb-5 overflow-hidden rounded-t-xl border border-border bg-background/40">
            <div className="flex items-center justify-between px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="relative flex h-1.5 w-1.5"
                >
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
                </span>
                <span>Incident Log · Session #????</span>
              </div>
              <span className="hidden sm:inline text-rose-600/80 dark:text-rose-400/80">
                no receipt found
              </span>
            </div>
            <div className="h-px w-full bg-[linear-gradient(90deg,transparent_0,transparent_4px,var(--color-border,#d4d4dc)_4px,var(--color-border,#d4d4dc)_8px)] bg-[length:8px_1px]" />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {/* 01 — amber */}
            <article className="group relative rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-[0_10px_30px_-12px_rgba(245,158,11,0.18)]">
              <div className="mb-5 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105 dark:text-amber-400">
                  <svg
                    width="22"
                    height="22"
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
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-sm bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Warn
                  </span>
                  <span className="font-mono text-xs text-muted-foreground/50">
                    01
                  </span>
                </div>
              </div>
              <h3 className="mb-2 text-base font-semibold">
                Agents take real actions
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your AI agents approve expenses, send emails, update records,
                and trigger payments. These are not suggestions. They are real
                actions with real consequences.
              </p>
            </article>

            {/* 02 — rose */}
            <article className="group relative rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/40 hover:shadow-[0_10px_30px_-12px_rgba(244,63,94,0.18)]">
              <div className="mb-5 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105 dark:text-rose-400">
                  <svg
                    width="22"
                    height="22"
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
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-sm bg-rose-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Miss
                  </span>
                  <span className="font-mono text-xs text-muted-foreground/50">
                    02
                  </span>
                </div>
              </div>
              <h3 className="mb-2 text-base font-semibold">
                No readable record exists
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                When something goes wrong, there is no agent action log a
                non-technical person can read. No receipt you can hand to your
                compliance team or your customer.
              </p>
            </article>

            {/* 03 — indigo */}
            <article className="group relative rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-[0_10px_30px_-12px_rgba(99,102,241,0.18)]">
              <div className="mb-5 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105 dark:text-indigo-400">
                  <svg
                    width="22"
                    height="22"
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
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-sm bg-indigo-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Audit
                  </span>
                  <span className="font-mono text-xs text-muted-foreground/50">
                    03
                  </span>
                </div>
              </div>
              <h3 className="mb-2 text-base font-semibold">
                Audits need answers
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Wrong payment to the wrong vendor. An email sent to the wrong
                customer. Your audit asks what your AI did last Tuesday. A log
                of what happened is not enough. You need to know what the agent
                saw and what rules it was following when it made the call.
              </p>
            </article>
          </div>

          {/* Bottom meta strip — tears off the incident log */}
          <div className="mt-5 flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60">
            <span
              aria-hidden="true"
              className="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-border"
            />
            <span>End of log · unresolved</span>
            <span
              aria-hidden="true"
              className="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-border"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl lg:max-w-4xl">
          <div className="mb-4 flex items-center justify-center gap-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <span aria-hidden="true" className="h-px w-8 bg-border" />
            How it works
            <span aria-hidden="true" className="h-px w-8 bg-border" />
          </div>
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
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  Every LLM call, tool call, and decision is captured
                  automatically as an LLM audit log. Your agent code does not
                  change. If the SDK cannot reach our servers, it fails
                  silently. Your agent keeps running.
                </p>
                {/* Live session indicator — ticking events */}
                <div className="overflow-hidden rounded-xl border border-border bg-background/40">
                  <div className="flex items-center justify-between border-b border-border px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      <span>Session #A7F3 · capturing</span>
                    </div>
                    <span className="hidden sm:inline">23 events</span>
                  </div>
                  <div className="divide-y divide-border font-mono text-[11.5px]">
                    <div className="flex items-center justify-between px-4 py-2">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="text-muted-foreground/60">
                          14:02:14
                        </span>
                        <span className="text-foreground">llm.call</span>
                        <span className="hidden sm:inline text-muted-foreground/70">
                          gpt-4o
                        </span>
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ok
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="text-muted-foreground/60">
                          14:02:17
                        </span>
                        <span className="text-foreground">tool.call</span>
                        <span className="hidden sm:inline text-muted-foreground/70">
                          stripe.charge
                        </span>
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ok
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-indigo-500/[0.04] px-4 py-2">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="text-muted-foreground/60">
                          14:02:19
                        </span>
                        <span className="text-foreground">tool.call</span>
                        <span className="hidden sm:inline text-muted-foreground/70">
                          email.send
                        </span>
                      </div>
                      <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                        <span
                          aria-hidden="true"
                          className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500"
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
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  Open the dashboard and see a human-readable timeline of
                  everything your agent did. Each receipt shows the full
                  decision context: the rules, permissions, and state your agent
                  was operating under when it acted. Every event is hash-chained
                  for tamper-proof verification. Share any receipt with a
                  one-click link.
                </p>
                {/* Mini receipt card preview */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-[0_10px_30px_-15px_rgba(99,102,241,0.2)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        <span>Receipt</span>
                        <span aria-hidden="true" className="text-border">
                          ·
                        </span>
                        <span>A7F3</span>
                        <span aria-hidden="true" className="text-border">
                          ·
                        </span>
                        <span>14:02 UTC</span>
                      </div>
                      <p className="mt-2 truncate text-sm font-semibold">
                        Process invoice #441
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        4 events · 9.2s · exit 0
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      <svg
                        width="10"
                        height="10"
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
                      Verified
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-3 font-mono text-[10px] text-muted-foreground">
                    <span>hash c72e…f031</span>
                    <span className="hidden sm:inline">
                      anchored · sigstore
                    </span>
                    <span className="inline-flex items-center gap-1 text-foreground/70 transition-colors hover:text-foreground">
                      share link
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 12h14M13 6l6 6-6 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
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
          <div className="mb-4 flex items-center justify-center gap-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <span aria-hidden="true" className="h-px w-8 bg-border" />
            How receipts stay honest
            <span aria-hidden="true" className="h-px w-8 bg-border" />
          </div>
          <h2 className="mb-20 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Every receipt is tamper-proof
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Featured — Tamper-proof (span 2) */}
            <section className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-colors hover:border-foreground/20 md:col-span-2">
              <div className="relative z-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Hash chain
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  Tamper-proof by design
                </h3>
                <p className="mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Every event is hash-chained to the one before it. Receipts are
                  append-only. Nobody can edit or delete events after the fact.
                  Not even you.
                </p>
                {/* Hash chain diagram */}
                <div className="flex items-center gap-2 overflow-x-auto font-mono text-[10px]">
                  <div className="shrink-0 rounded-md border border-border bg-background/60 px-2.5 py-1.5">
                    <div className="text-muted-foreground/50">event[0]</div>
                    <div className="text-muted-foreground">a1f3…9e2c</div>
                  </div>
                  <svg
                    width="18"
                    height="12"
                    viewBox="0 0 18 12"
                    fill="none"
                    className="shrink-0 text-muted-foreground/40"
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
                  <div className="shrink-0 rounded-md border border-border bg-background/60 px-2.5 py-1.5">
                    <div className="text-muted-foreground/50">event[1]</div>
                    <div className="text-muted-foreground">b8d0…4a71</div>
                  </div>
                  <svg
                    width="18"
                    height="12"
                    viewBox="0 0 18 12"
                    fill="none"
                    className="shrink-0 text-muted-foreground/40"
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
                  <div className="shrink-0 rounded-md border border-indigo-500/40 bg-indigo-500/10 px-2.5 py-1.5 text-indigo-600 dark:text-indigo-400">
                    <div className="opacity-60">event[2]</div>
                    <div>c72e…f031</div>
                  </div>
                </div>
              </div>
            </section>

            {/* EU AI Act */}
            <section className="group rounded-2xl border border-border bg-card p-8 transition-colors hover:border-foreground/20">
              <div className="mb-4 inline-flex h-9 items-center rounded-md border border-border bg-background/50 px-3 font-mono text-xs font-semibold text-muted-foreground">
                EU · ART. 19
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

            {/* US compliance */}
            <section className="group rounded-2xl border border-border bg-card p-8 transition-colors hover:border-foreground/20">
              <div className="mb-4 flex flex-wrap gap-1.5">
                <span className="rounded bg-muted px-2 py-1 font-mono text-[10px] font-semibold text-muted-foreground">
                  SOC 2
                </span>
                <span className="rounded bg-muted px-2 py-1 font-mono text-[10px] font-semibold text-muted-foreground">
                  HIPAA
                </span>
                <span className="rounded bg-muted px-2 py-1 font-mono text-[10px] font-semibold text-muted-foreground">
                  SOX
                </span>
                <span className="rounded bg-muted px-2 py-1 font-mono text-[10px] font-semibold text-muted-foreground">
                  SEC
                </span>
              </div>
              <h3 className="mb-2 text-base font-semibold">US compliance</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                SOC 2 audits ask for activity logs. HIPAA requires six-year
                retention for healthcare data. SOX and SEC rules require
                financial agents to prove they followed execution rules. One
                audit trail covers all of them.
              </p>
            </section>

            {/* Human review */}
            <section className="group rounded-2xl border border-border bg-card p-8 transition-colors hover:border-foreground/20">
              <div className="mb-4 flex -space-x-2">
                <div className="h-8 w-8 rounded-full border-2 border-card bg-gradient-to-br from-indigo-400 to-indigo-600" />
                <div className="h-8 w-8 rounded-full border-2 border-card bg-gradient-to-br from-emerald-400 to-emerald-600" />
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted font-mono text-[10px] text-muted-foreground">
                  +1
                </div>
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

            {/* PII flagging */}
            <section className="group rounded-2xl border border-border bg-card p-8 transition-colors hover:border-foreground/20">
              <div className="mb-4 flex flex-wrap gap-1.5 font-mono text-[10px]">
                <span className="rounded bg-amber-500/10 px-2 py-1 text-amber-600 dark:text-amber-400">
                  [PII]
                </span>
                <span className="rounded bg-rose-500/10 px-2 py-1 text-rose-600 dark:text-rose-400">
                  [MEDICAL]
                </span>
                <span className="rounded bg-indigo-500/10 px-2 py-1 text-indigo-600 dark:text-indigo-400">
                  [FINANCIAL]
                </span>
              </div>
              <h3 className="mb-2 text-base font-semibold">PII flagging</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Tag events that contain sensitive data. Mark health records,
                financial data, or personal information so your compliance team
                knows exactly which events to scrutinise.
              </p>
            </section>

            {/* Featured — Sigstore (span 3) */}
            <section className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-colors hover:border-foreground/20 md:col-span-3">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="max-w-xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Pro · Business
                  </div>
                  <h3 className="mb-2 text-base font-semibold">
                    Anchored on a public log
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Pro and Business receipts are anchored to the Sigstore Rekor
                    transparency log after every session. This is a public,
                    permanent record that proves the receipt existed at a
                    specific time and has not been changed. Anyone can verify it
                    independently.
                  </p>
                </div>
                {/* Mini rekor-cli panel */}
                <div className="w-full rounded-lg border border-border bg-background/60 p-4 font-mono text-[11px] text-muted-foreground md:w-auto md:min-w-[260px]">
                  <div className="flex items-center gap-1.5 border-b border-border pb-2 text-muted-foreground/60">
                    <span className="h-2 w-2 rounded-full bg-rose-500/70" />
                    <span className="h-2 w-2 rounded-full bg-amber-500/70" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
                    <span className="ml-2 text-[10px]">rekor-cli</span>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    <div className="text-muted-foreground/60">
                      $ rekor-cli search
                    </div>
                    <div>uuid: 24296fb2…ad77a</div>
                    <div>index: 142893041</div>
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500">
                      <svg
                        width="10"
                        height="10"
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
                      <span>verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center justify-center gap-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <span aria-hidden="true" className="h-px w-8 bg-border" />
            Pricing
            <span aria-hidden="true" className="h-px w-8 bg-border" />
          </div>
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

      {/* FAQ — framed as a receipt docket */}
      <section className="bg-surface px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center justify-center gap-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <span aria-hidden="true" className="h-px w-8 bg-border" />
            FAQ · Docket
            <span aria-hidden="true" className="h-px w-8 bg-border" />
          </div>
          <h2 className="mb-4 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Common questions
          </h2>
          <p className="mx-auto mb-16 max-w-md text-center text-sm text-muted-foreground">
            Everything we get asked before the first integration.
          </p>
          <div className="space-y-3">
            <details className="group rounded-xl border border-border bg-card transition-colors hover:border-foreground/20 open:border-foreground/20">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-4">
                  <span className="font-mono text-xs text-muted-foreground/50">
                    01
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    Will this slow down my agent?
                  </span>
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
              <div className="px-6 pb-6 pl-[3.75rem] text-sm leading-relaxed text-muted-foreground">
                No. The SDK sends events asynchronously in batches. If it cannot
                reach our servers, it fails silently. Your agent keeps running
                regardless.
              </div>
            </details>

            <details className="group rounded-xl border border-border bg-card transition-colors hover:border-foreground/20 open:border-foreground/20">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-4">
                  <span className="font-mono text-xs text-muted-foreground/50">
                    02
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    Where is my data stored?
                  </span>
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
              <div className="px-6 pb-6 pl-[3.75rem] text-sm leading-relaxed text-muted-foreground">
                Event metadata is stored in our database. Raw LLM inputs and
                outputs are stored separately in Cloudflare R2. You can request
                deletion of raw payloads at any time to comply with GDPR Article
                17.
              </div>
            </details>

            <details className="group rounded-xl border border-border bg-card transition-colors hover:border-foreground/20 open:border-foreground/20">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-4">
                  <span className="font-mono text-xs text-muted-foreground/50">
                    03
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    Who can see my receipts?
                  </span>
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
              <div className="px-6 pb-6 pl-[3.75rem] text-sm leading-relaxed text-muted-foreground">
                Only members of your workspace. You can invite your compliance
                team, legal counsel, or any other stakeholder directly. They see
                everything you see. You can also generate a shareable link for
                any receipt and send it to anyone. No login required.
              </div>
            </details>

            <details className="group rounded-xl border border-border bg-card transition-colors hover:border-foreground/20 open:border-foreground/20">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-4">
                  <span className="font-mono text-xs text-muted-foreground/50">
                    04
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    What counts as a session?
                  </span>
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
              <div className="px-6 pb-6 pl-[3.75rem] text-sm leading-relaxed text-muted-foreground">
                One end-to-end agent run. Processing one invoice, handling one
                support ticket, running one scheduled job. Each session captures
                up to 200 events.
              </div>
            </details>

            <details className="group rounded-xl border border-border bg-card transition-colors hover:border-foreground/20 open:border-foreground/20">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-4">
                  <span className="font-mono text-xs text-muted-foreground/50">
                    05
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    Which AI providers does it support?
                  </span>
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
              <div className="px-6 pb-6 pl-[3.75rem] text-sm leading-relaxed text-muted-foreground">
                OpenAI, Anthropic, Gemini, Mistral, and the Vercel AI SDK. Each
                takes one line of code to integrate.
              </div>
            </details>

            <details className="group rounded-xl border border-border bg-card transition-colors hover:border-foreground/20 open:border-foreground/20">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-4">
                  <span className="font-mono text-xs text-muted-foreground/50">
                    06
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    Do I need to change my agent code?
                  </span>
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
              <div className="px-6 pb-6 pl-[3.75rem] text-sm leading-relaxed text-muted-foreground">
                No. You wrap your existing AI client with one line. The rest of
                your code stays exactly as it is.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA — closing receipt, bookend to the hero */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        {/* Dot grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(99, 102, 241, 0.22) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse 55% 70% at 50% 50%, black 20%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 55% 70% at 50% 50%, black 20%, transparent 100%)",
          }}
        />
        {/* Radial gradient glow (breathing) */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[heroGlow_7s_ease-in-out_infinite]"
          style={{
            width: "720px",
            height: "480px",
            background:
              "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.14) 0%, rgba(99, 102, 241, 0.05) 40%, transparent 70%)",
          }}
        />
        {/* Bottom corner annotation marks — bookend to the hero */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-20 hidden justify-between px-6 text-muted-foreground/25 sm:flex"
        >
          <div className="h-7 w-7 border-b border-l border-current" />
          <div className="h-7 w-7 border-b border-r border-current" />
        </div>

        <div className="relative mx-auto max-w-2xl text-center">
          {/* End-of-receipt marker — echoes the hero receipt */}
          <div className="mb-8 flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <span
              aria-hidden="true"
              className="h-px w-12 bg-gradient-to-r from-transparent to-border"
            />
            End of Receipt
            <span
              aria-hidden="true"
              className="h-px w-12 bg-gradient-to-l from-transparent to-border"
            />
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl leading-[1.1]">
            Your agents are{" "}
            <span className="relative inline-block">
              <span className="relative z-10">already</span>
              <svg
                className="absolute -bottom-1.5 left-0 z-0 h-2.5 w-full overflow-visible text-indigo-500"
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8 Q 50 2, 100 6 T 197 5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            taking actions.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base text-muted-foreground">
            Start keeping a record of them. Free plan, no credit card, five
            minutes to set up.
          </p>
          <div className="mt-10">
            <Link
              href="/sign-in"
              className="group inline-flex items-center gap-2 rounded-lg bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-all hover:bg-foreground/85 hover:shadow-[0_0_0_4px_rgba(99,102,241,0.18)]"
            >
              Get started for free
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
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
            </Link>
          </div>

          {/* Receipt-style footer line — timestamp + hash, echoes the hero receipt */}
          <div className="mt-14 flex flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-px w-8 bg-gradient-to-r from-transparent to-border"
              />
              <span>
                signed · block c72e…f031
              </span>
              <span
                aria-hidden="true"
                className="h-px w-8 bg-gradient-to-l from-transparent to-border"
              />
            </div>
            {/* Mini barcode */}
            <div
              aria-hidden="true"
              className="flex h-4 items-end gap-[2px] opacity-50"
            >
              {[3, 5, 2, 6, 4, 3, 5, 2, 6, 3, 4, 2, 5, 6, 3, 4, 2, 5, 3, 6, 2, 4].map(
                (h, i) => (
                  <span
                    key={i}
                    className="block w-[2px] bg-muted-foreground"
                    style={{ height: `${h * 2.5}px` }}
                  />
                )
              )}
            </div>
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
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
