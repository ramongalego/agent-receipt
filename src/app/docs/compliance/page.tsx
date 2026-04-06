import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compliance",
};

export default function CompliancePage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight">Compliance</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        How AgentReceipt helps you meet regulatory requirements for AI agent
        logging and data retention.
      </p>

      {/* EU AI Act */}
      <h2
        id="eu-ai-act"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        EU AI Act
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Article 19 of the EU AI Act requires providers of high-risk AI systems
        to retain automatically generated logs for a minimum of six months. The
        logs must be sufficient to reconstruct what the system did and why.
        Enforcement begins in August 2026.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        AgentReceipt stores events in an append-only database with configurable
        retention periods. The Pro plan retains data for 90 days and the
        Business plan for 1 year. For high-risk systems that need 6 months or
        more, the Business plan meets this requirement out of the box. The hash
        chain provides verifiable proof that logs have not been altered since
        they were recorded.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        If your AI system falls under the high-risk category, AgentReceipt gives
        you structured, timestamped, hash-verified logs of every action your
        agent took. These logs are queryable, human-readable, and available for
        export.
      </p>
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          This is not legal advice. Talk to your legal team about your specific
          obligations under the EU AI Act.
        </p>
      </div>

      {/* SOC 2 and HIPAA */}
      <h2
        id="soc-2-and-hipaa"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        SOC 2 and HIPAA
      </h2>
      <h3 className="mt-8 text-lg font-semibold">SOC 2</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Audit trails are a core control in SOC 2 compliance. If your
        organization undergoes SOC 2 audits and you use AI agents that take
        actions on behalf of users or customers, you need structured, queryable
        logs of what those agents did. AgentReceipt provides exactly that: a
        timestamped record of every action, with hash chain verification to
        prove the logs have not been modified.
      </p>

      <h3 className="mt-8 text-lg font-semibold">HIPAA</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        HIPAA requires covered entities to retain audit logs for six years when
        handling protected health information (PHI). If your AI agent processes
        patient records, medical data, or any PHI, use the{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          retentionOverride
        </code>{" "}
        field to set a 2,190-day retention period on those events. Tag them with{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          dataCategory: &quot;health&quot;
        </code>{" "}
        and{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          containsPII: true
        </code>{" "}
        so your compliance team can filter and review them.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        For organizations that need retention beyond what the standard plans
        offer, contact us about an Enterprise plan with custom retention
        periods.
      </p>
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          This is not legal advice. Talk to your legal team about your specific
          HIPAA obligations.
        </p>
      </div>

      {/* PII handling */}
      <h2
        id="pii-handling"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        PII handling
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        When you tag an event with{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          containsPII: true
        </code>{" "}
        or set a{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          dataCategory
        </code>
        , AgentReceipt treats that event&apos;s payload as sensitive. This
        affects how the payload is displayed and shared.
      </p>

      <h3 className="mt-8 text-lg font-semibold">In the dashboard</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        PII-flagged events show a purple PII badge in the timeline. The payload
        is hidden by default. Team members must click &ldquo;Reveal sensitive
        data&rdquo; to view the input and output. This prevents accidental
        exposure during screen shares or demos.
      </p>

      <h3 className="mt-8 text-lg font-semibold">In shared receipts</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        When a session is shared via link, PII-flagged events are fully
        redacted. Public viewers can see that the event happened (the event
        name, type, and timestamp are still visible), but they cannot access the
        payload. This is enforced server-side. The payload is never sent to the
        browser for shared receipt viewers.
      </p>

      {/* GDPR and data deletion */}
      <h2
        id="gdpr-and-data-deletion"
        className="mt-16 scroll-mt-24 text-2xl font-bold tracking-tight"
      >
        GDPR and data deletion
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        There is a tension between immutability and the right to erasure under
        GDPR Article 17. AgentReceipt handles this by separating what is
        immutable from what can be deleted.
      </p>

      <h3 className="mt-8 text-lg font-semibold">What is immutable</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Event metadata (timestamps, event type, duration, event name) and the
        hash chain are immutable. They cannot be deleted or modified. This is
        what makes the audit trail trustworthy. Removing a single event would
        break the hash chain and invalidate the entire receipt.
      </p>

      <h3 className="mt-8 text-lg font-semibold">What can be deleted</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Raw LLM payloads (the actual input and output content of each event) are
        stored separately in Cloudflare R2. These payloads can be deleted on
        request without breaking the hash chain, because the hash is computed
        from the event metadata, not the raw payload content.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        To request payload deletion, contact support with the session ID. We
        will delete the raw payloads from R2 while preserving the event metadata
        and hash chain. The receipt will still show the event timeline, but
        expanding an event will show that the payload has been deleted.
      </p>
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          This is not legal advice. Talk to your legal team about your specific
          GDPR obligations.
        </p>
      </div>
    </article>
  );
}
