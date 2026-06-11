import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PublicNav } from "@/components/layout/public-nav";
import { HashChainBadge } from "@/components/ui/hash-chain-badge";
import { DemoTimeline, DemoRekorBadge, DemoContextCard } from "./demo-timeline";

const DEMO_SESSION_CONTEXT = {
  systemPrompt:
    "You are an accounts payable agent. Process incoming invoices by extracting data, verifying vendors, and triggering payments when appropriate. Follow all approval rules strictly.",
  activeRules: [
    {
      id: "auto-approve-threshold",
      description: "Auto-approve payments under $5,000 for verified vendors",
      parameters: { threshold: 5000, currency: "USD" },
    },
    {
      id: "vendor-must-be-verified",
      description:
        "Vendor must exist in the database and be marked as verified",
    },
    {
      id: "duplicate-check",
      description:
        "Reject invoices with the same number from the same vendor within 30 days",
      parameters: { windowDays: 30 },
    },
  ],
  permissions: [
    "read:invoices",
    "read:vendors",
    "write:payments",
    "write:audit-log",
  ],
  environment: {
    accountTier: "business",
    region: "us-east-1",
    approver: "agent@widgetinc.com",
  },
};

const DEMO_EVENTS = [
  {
    id: "evt_001",
    type: "llm_call" as const,
    name: "Parse invoice",
    durationMs: 2340,
    timestamp: "2026-03-13T10:00:12.000Z",
    input: {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content:
            "Extract the structured data from this invoice:\n\nInvoice #441\nFrom: Acme Corp\nTo: Widget Inc\nDate: 2026-03-10\nAmount: $4,500.00\nDescription: Q1 consulting services\nDue: 2026-04-10",
        },
      ],
    },
    output: {
      invoiceNumber: "441",
      vendor: "Acme Corp",
      recipient: "Widget Inc",
      amount: 4500.0,
      currency: "USD",
      description: "Q1 consulting services",
      issueDate: "2026-03-10",
      dueDate: "2026-04-10",
    },
  },
  {
    id: "evt_002",
    type: "tool_call" as const,
    name: "Look up vendor",
    durationMs: 180,
    timestamp: "2026-03-13T10:00:14.500Z",
    input: {
      vendorName: "Acme Corp",
    },
    output: {
      id: "vendor_0042",
      name: "Acme Corp",
      verified: true,
      bankAccount: "****7890",
      autoApprovalLimit: 5000.0,
      totalPaid: 27500.0,
      invoiceCount: 8,
    },
  },
  {
    id: "evt_003",
    type: "decision" as const,
    name: "Approve payment",
    durationMs: 0,
    timestamp: "2026-03-13T10:00:14.700Z",
    input: {
      reasoning:
        "Invoice amount $4,500 is within the $5,000 auto-approval limit for Acme Corp. Vendor is verified. No anomalies detected.",
    },
    output: {
      outcome: "approved",
      approvalType: "automatic",
    },
    context: {
      rulesEvaluated: [
        "auto-approve-threshold",
        "vendor-must-be-verified",
        "duplicate-check",
      ],
      stateAtDecision: {
        invoiceAmount: 4500,
        approvalThreshold: 5000,
        vendorVerified: true,
        duplicateFound: false,
      },
    },
  },
  {
    id: "evt_004",
    type: "tool_call" as const,
    name: "Trigger payment",
    durationMs: 1200,
    timestamp: "2026-03-13T10:00:15.900Z",
    input: {
      vendorId: "vendor_0042",
      amount: 4500.0,
      currency: "USD",
      reference: "INV-441",
    },
    output: {
      paymentId: "pay_8x9k2m",
      status: "initiated",
      estimatedArrival: "2026-03-14",
    },
  },
];

const DEMO_SUMMARY =
  "The agent processed invoice #441 from Acme Corp for $4,500. It parsed the invoice text to extract structured data, then looked up Acme Corp in the vendor database and confirmed they are a verified vendor. Because the amount was within the $5,000 auto-approval limit, the agent approved the payment automatically. It then triggered a bank transfer to Acme Corp, which was initiated successfully.";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />

      <div className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Sample receipt</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Process invoice #441
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Badge variant="success">complete</Badge>
                <span className="text-muted-foreground/40">|</span>
                <span className="text-xs text-muted-foreground/70">
                  4 events
                </span>
                <span className="text-xs text-muted-foreground/70">
                  3.7s total
                </span>
                <span className="text-xs text-muted-foreground/70">
                  Mar 13, 2026, 10:00 AM
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <HashChainBadge valid />
            <DemoRekorBadge />
          </div>
        </div>

        {/* Summary */}
        <Card>
          <div className="px-5 py-4">
            <div className="flex items-center gap-2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              <h2 className="text-base font-semibold">Receipt summary</h2>
            </div>
          </div>
          <div className="border-t border-border px-5 pb-5 pt-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {DEMO_SUMMARY}
            </p>
          </div>
        </Card>

        {/* Decision Context, collapsible */}
        <div className="mt-6">
          <DemoContextCard context={DEMO_SESSION_CONTEXT} />
        </div>

        {/* Timeline */}
        <Card className="mt-6">
          <div className="px-5 py-4">
            <div className="flex items-center gap-2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <h2 className="text-base font-semibold">Event timeline</h2>
            </div>
          </div>
          <DemoTimeline events={DEMO_EVENTS} />
        </Card>

        <p className="mt-8 text-xs text-muted-foreground/60">
          Event metadata and hash records are immutable. Raw payload content is
          stored separately and can be deleted on request to comply with GDPR
          Article 17.
        </p>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-border bg-muted/50 p-10 text-center sm:p-14">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            This is what every agent run looks like in AgentReceipt
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            Get a clear, tamper-proof record of every action your AI agent
            takes. Free plan includes 100 sessions per month.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-in"
              className="inline-flex w-full items-center justify-center rounded-xl bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/85 sm:w-auto"
            >
              Start for free
            </Link>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-xl border border-border px-8 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground sm:w-auto"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AgentReceipt
          </span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link
              href="/docs"
              className="transition-colors hover:text-foreground"
            >
              Docs
            </Link>
            <Link
              href="/sign-in"
              className="transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
