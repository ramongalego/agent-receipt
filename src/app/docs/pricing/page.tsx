import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing and Limits",
};

export default function PricingPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight">Pricing and limits</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Plan details, session limits, retention periods, and what happens when
        you hit a limit.
      </p>

      {/* Plans */}
      <h2
        id="plans"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        Plans
      </h2>
      <div className="my-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 pr-6 font-semibold">Plan</th>
              <th className="pb-3 pr-6 font-semibold">Price</th>
              <th className="pb-3 pr-6 font-semibold">Sessions / month</th>
              <th className="pb-3 font-semibold">Retention</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              <td className="py-3 pr-6 font-medium">Free</td>
              <td className="py-3 pr-6 text-muted-foreground">$0</td>
              <td className="py-3 pr-6 text-muted-foreground">100</td>
              <td className="py-3 text-muted-foreground">7 days</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-3 pr-6 font-medium">Pro</td>
              <td className="py-3 pr-6 text-muted-foreground">$49 / month</td>
              <td className="py-3 pr-6 text-muted-foreground">5,000</td>
              <td className="py-3 text-muted-foreground">90 days</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-3 pr-6 font-medium">Business</td>
              <td className="py-3 pr-6 text-muted-foreground">$199 / month</td>
              <td className="py-3 pr-6 text-muted-foreground">50,000</td>
              <td className="py-3 text-muted-foreground">1 year</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        All plans include the same features: hash chain verification, compliance
        metadata, human review tracking, and all SDK wrappers. Plans differ only
        in session volume and retention.{" "}
        <Link
          href="/sign-in"
          className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
        >
          Start for free
        </Link>{" "}
        and upgrade when you need more.
      </p>

      {/* Session limits */}
      <h2
        id="session-limits"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        Session limits
      </h2>
      <h3 className="mt-8 text-lg font-semibold">What counts as a session</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        A session is one end-to-end agent run. Processing one invoice, handling
        one support ticket, generating one report. Each session can contain up
        to 200 events. The monthly limit counts sessions, not events. A session
        with 3 events and a session with 200 events both count as one session.
      </p>

      <h3 className="mt-8 text-lg font-semibold">
        What happens when you hit your limit
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        When you reach your monthly session limit, the ingest endpoint returns
        HTTP 429 with the error code{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          LIMIT_REACHED
        </code>
        . Your agent keeps running. The SDK logs a warning and continues. The
        session is not recorded, but your agent code executes normally.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Existing sessions that started before you hit the limit can still
        receive events. The limit only blocks the creation of new sessions.
      </p>
      <div className="mt-6 rounded-lg border border-border bg-muted/50 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          If you are regularly hitting your session limit, upgrade your plan
          from the{" "}
          <Link
            href="/dashboard/billing"
            className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
          >
            billing page
          </Link>
          .
        </p>
      </div>

      {/* Retention */}
      <h2
        id="retention"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        Retention
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Events older than your plan&apos;s retention period are deleted
        automatically. Deletion happens in two stages:
      </p>
      <ol className="mt-4 list-inside list-decimal space-y-2 text-sm text-muted-foreground">
        <li>
          <strong className="text-foreground">Raw payloads</strong> (stored in
          Cloudflare R2) are deleted first. This removes the actual LLM input
          and output content.
        </li>
        <li>
          <strong className="text-foreground">Event metadata</strong>{" "}
          (timestamps, event type, hash chain) is deleted shortly after.
        </li>
      </ol>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        If an event has a{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          retentionOverride
        </code>{" "}
        set via compliance metadata, that override takes priority over the plan
        default. This lets you keep healthcare or financial data for longer than
        your plan would normally allow.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Once data is deleted, it cannot be recovered. If you need to preserve
        receipts for longer than your plan allows, export them before the
        retention window closes or upgrade your plan.
      </p>

      {/* Event limits */}
      <h2
        id="event-limits"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        Event limits
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Each session can hold a maximum of 200 events. This prevents unbounded
        event growth within a single session, which would generate
        disproportionate storage costs regardless of the plan.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        When a session reaches 200 events, the ingest endpoint returns HTTP 429
        with the error code{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          SESSION_EVENT_LIMIT
        </code>
        . A system error event is recorded so the receipt shows exactly where
        and why ingestion stopped.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        If your agent workflow needs more than 200 events, split the work into
        multiple sessions at logical boundaries. For example, if you are
        processing a batch of 50 invoices, create one session per invoice
        instead of one session for the entire batch.
      </p>
    </article>
  );
}
