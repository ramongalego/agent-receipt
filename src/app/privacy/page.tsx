import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/layout/public-nav";

export const metadata: Metadata = {
  title: "Privacy Policy · AgentReceipt",
  description:
    "What data AgentReceipt collects, how it is used, and what rights you have over it.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />

      <main className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: March 22, 2026
        </p>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          This policy explains what data AgentReceipt collects, how it is used,
          and what rights you have over it.
        </p>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">Who we are</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            AgentReceipt is based in the United Kingdom. If you have questions
            about this policy, contact us at{" "}
            <a
              href="mailto:support@agentreceipt.co"
              className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
            >
              support@agentreceipt.co
            </a>
            .
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">What data we collect</h2>

          <h3 className="mt-6 text-base font-semibold">Account data</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            When you sign up, we collect your email address and, if you use
            GitHub or Google OAuth, your name and profile picture from that
            provider.
          </p>

          <h3 className="mt-6 text-base font-semibold">Billing data</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            If you subscribe to a paid plan, Stripe processes your payment
            details. We store your Stripe customer ID and subscription status.
            We do not store full card numbers.
          </p>

          <h3 className="mt-6 text-base font-semibold">Agent event data</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            When you integrate the AgentReceipt SDK into your application, we
            receive and store the events your agent sends. This includes LLM
            call inputs and outputs, tool call data, decisions, and any metadata
            you attach. This data may contain personal information depending on
            what your agent processes.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Raw payloads from LLM calls are stored in Cloudflare R2. Event
            metadata (timestamps, event types, hashes) is stored in our database
            hosted on Neon.
          </p>

          <h3 className="mt-6 text-base font-semibold">Usage data</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We collect basic usage information such as pages visited and actions
            taken in the dashboard. We do not use third-party analytics
            services.
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">How we use your data</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We use your data to:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>Provide and operate the AgentReceipt service</li>
            <li>
              Send transactional emails (magic links, invite notifications,
              billing receipts)
            </li>
            <li>Enforce plan limits and billing</li>
            <li>Respond to support requests</li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We do not sell your data. We do not use your data for advertising.
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">How long we keep your data</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Account data is kept for as long as your account is active. If you
            delete your account, we delete your account data within 30 days.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Agent event data is retained according to your plan:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>Free: 7 days</li>
            <li>Pro: 90 days</li>
            <li>Business: 365 days</li>
            <li>Enterprise: Custom, as agreed</li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Raw LLM payloads stored in Cloudflare R2 can be deleted on request
            regardless of your plan. See the GDPR section below.
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">Who we share data with</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We share data with these third-party services to operate the
            product:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>
              <strong className="text-foreground">Neon</strong> (database
              hosting) stores event metadata and account data. Located in AWS US
              East.
            </li>
            <li>
              <strong className="text-foreground">Cloudflare R2</strong> (object
              storage) stores raw LLM payloads. Global CDN.
            </li>
            <li>
              <strong className="text-foreground">Stripe</strong> (payments)
              processes subscription billing.
            </li>
            <li>
              <strong className="text-foreground">Resend</strong> (email) sends
              transactional emails.
            </li>
            <li>
              <strong className="text-foreground">Upstash</strong> (rate
              limiting) stores temporary rate limit counters. No personal data
              stored.
            </li>
            <li>
              <strong className="text-foreground">Vercel</strong> (hosting)
              serves the web application. May log request IP addresses.
            </li>
            <li>
              <strong className="text-foreground">Sigstore Rekor</strong>{" "}
              (transparency log) for Pro and Business plans, a hash of completed
              sessions is submitted to this public log. No personal data is
              included in the submission, only a cryptographic hash.
            </li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We do not share your data with any other third parties.
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">GDPR rights</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            If you are based in the European Union or United Kingdom, you have
            the following rights:
          </p>

          <h3 className="mt-6 text-base font-semibold">Right to access</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You can request a copy of the personal data we hold about you.
          </p>

          <h3 className="mt-6 text-base font-semibold">Right to correction</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You can ask us to correct inaccurate data.
          </p>

          <h3 className="mt-6 text-base font-semibold">Right to erasure</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You can request deletion of your personal data. We will delete your
            account data and raw LLM payloads from Cloudflare R2. Note that
            event metadata and hash chain records are stored in an append-only,
            immutable database as part of the audit trail. These records cannot
            be deleted, but they do not contain your LLM inputs and outputs.
          </p>

          <h3 className="mt-6 text-base font-semibold">Right to portability</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You can request an export of your data in a machine-readable format.
          </p>

          <h3 className="mt-6 text-base font-semibold">Right to object</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You can object to processing based on legitimate interests.
          </p>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            To exercise any of these rights, email{" "}
            <a
              href="mailto:support@agentreceipt.co"
              className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
            >
              support@agentreceipt.co
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">Data transfers</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            AgentReceipt is operated from the United Kingdom. Our infrastructure
            providers (Neon, Cloudflare, Vercel) may store data in the United
            States. Where data is transferred outside the UK or EU, we rely on
            standard contractual clauses or equivalent mechanisms.
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">Security</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We use encryption in transit (HTTPS) and at rest for all stored
            data. API keys are stored as SHA-256 hashes. Access to production
            systems is restricted to authorised personnel.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            If you discover a security vulnerability, please email{" "}
            <a
              href="mailto:support@agentreceipt.co"
              className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
            >
              support@agentreceipt.co
            </a>
            .
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">Changes to this policy</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We will update this page when this policy changes and update the
            date at the top. For significant changes, we will notify you by
            email.
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            <a
              href="mailto:support@agentreceipt.co"
              className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
            >
              support@agentreceipt.co
            </a>
          </p>
        </section>
      </main>

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
                    <Link
                      href="/#pricing"
                      className="transition-colors hover:text-foreground"
                    >
                      Pricing
                    </Link>
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
