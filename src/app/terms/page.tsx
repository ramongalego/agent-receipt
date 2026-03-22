import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/layout/public-nav";

export const metadata: Metadata = {
  title: "Terms of Service · AgentReceipt",
  description: "Terms governing your use of AgentReceipt.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />

      <main className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: March 22, 2026
        </p>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          These terms govern your use of AgentReceipt. By creating an account,
          you agree to them.
        </p>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">Who these terms are between</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            These terms are between you (the user or the company you represent)
            and AgentReceipt, based in the United Kingdom.
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">The service</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            AgentReceipt provides tools for capturing and storing audit trails
            of AI agent actions. This includes a web dashboard, an SDK, and an
            API. We may change or discontinue features at any time. We will give
            reasonable notice before shutting down the service.
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">Your account</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            You are responsible for keeping your account credentials secure. Do
            not share API keys. If you believe your account has been
            compromised, contact us immediately.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            You must be at least 18 years old to use AgentReceipt. You must not
            use the service to violate any laws or the rights of others.
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">What you can and cannot do</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            You can:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>Use AgentReceipt to capture audit trails for your AI agents</li>
            <li>Invite team members to your workspace</li>
            <li>Export your data</li>
            <li>Cancel your subscription at any time</li>
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            You cannot:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>Resell or sublicense AgentReceipt</li>
            <li>
              Use AgentReceipt to store data in violation of applicable laws
            </li>
            <li>Attempt to reverse engineer, attack, or disrupt the service</li>
            <li>
              Use the service in a way that exceeds your plan limits to avoid
              paying
            </li>
          </ul>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">Data you send us</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            You own the data you send to AgentReceipt. By using the service, you
            give us permission to store and process that data to provide the
            service. We do not claim any ownership over your agent data.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            You are responsible for ensuring you have the right to send us data,
            including any personal data your agents process. If your agents
            handle personal data, you may need a Data Processing Agreement.
            Contact{" "}
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
          <h2 className="text-xl font-semibold">Subscriptions and billing</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Free plan: No payment required. Limited to 100 sessions per month
            and 7 days retention.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Paid plans: Billed monthly or annually via Stripe. You can cancel at
            any time. Cancellation takes effect at the end of your current
            billing period. We do not offer refunds for partial periods.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            If your payment fails, we will retry. If payment continues to fail,
            your account will be downgraded to the Free plan.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We may change prices with 30 days notice. Existing subscribers will
            be notified by email before any price change takes effect.
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">Plan limits</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Each plan has a monthly session limit. If you exceed it, the ingest
            endpoint will return a 429 error for new sessions until the next
            billing period. Existing sessions and their data are not affected.
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">Uptime and reliability</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We aim to keep AgentReceipt available but do not guarantee
            uninterrupted service. The SDK is designed to fail silently if it
            cannot reach our servers, so your agents continue running even if
            AgentReceipt is unavailable.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We do not offer a formal SLA on the Free, Pro, or Business plans.
            Enterprise customers may negotiate an SLA separately.
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">Termination</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            You can delete your account at any time from the dashboard settings.
            We will delete your data within 30 days, subject to the immutability
            note in our{" "}
            <Link
              href="/privacy"
              className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
            >
              Privacy Policy
            </Link>
            .
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We may suspend or terminate your account if you violate these terms,
            with or without notice depending on the severity.
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">Liability</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            AgentReceipt is provided as is. We are not liable for any losses
            arising from your use of the service, including data loss, missed
            compliance requirements, or agent errors. Our total liability is
            limited to the amount you paid us in the three months before the
            claim.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Nothing in these terms limits liability for fraud, death, or
            personal injury caused by negligence, as required by UK law.
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">Governing law</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            These terms are governed by the laws of England and Wales. Any
            disputes will be resolved in the courts of England and Wales.
          </p>
        </section>

        <hr className="my-12 border-border" />

        <section>
          <h2 className="text-xl font-semibold">Changes to these terms</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            We will update this page when these terms change and update the date
            at the top. For significant changes, we will notify you by email 30
            days in advance.
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
