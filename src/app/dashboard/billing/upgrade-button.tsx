"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getPlanLimits } from "@/lib/billing-plans";
import { createCheckoutSession } from "./actions";

type UpgradePlan = {
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  yearlyTotal: string;
  yearlySavings: string;
  audience: string;
  highlighted?: boolean;
  monthlyPriceId: string | null;
  yearlyPriceId: string | null;
};

const PLANS: UpgradePlan[] = [
  {
    name: "Pro",
    monthlyPrice: "$49",
    yearlyPrice: "$39",
    yearlyTotal: "$470",
    yearlySavings: "$118",
    audience: "For small teams shipping agents in production.",
    highlighted: true,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? null,
    yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY ?? null,
  },
  {
    name: "Business",
    monthlyPrice: "$199",
    yearlyPrice: "$159",
    yearlyTotal: "$1,910",
    yearlySavings: "$478",
    audience: "For teams running agents across multiple workflows.",
    monthlyPriceId:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY ?? null,
    yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_YEARLY ?? null,
  },
];

export function UpgradeButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Upgrade</Button>
      {open && <UpgradeModal onClose={() => setOpen(false)} />}
    </>
  );
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [isYearly, setIsYearly] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleUpgrade(plan: UpgradePlan) {
    const priceId = isYearly ? plan.yearlyPriceId : plan.monthlyPriceId;
    if (!priceId) {
      toast.error("Billing is not configured. Contact support.");
      return;
    }
    startTransition(async () => {
      const result = await createCheckoutSession(priceId);
      if ("data" in result && result.data?.url) {
        window.location.href = result.data.url;
      } else if ("error" in result) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        role="button"
        tabIndex={0}
        aria-label="Close upgrade dialog"
      />
      <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card p-8 shadow-lg">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-card-foreground">
          Upgrade your plan
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          More sessions, longer retention. Cancel anytime.
        </p>

        {/* Toggle */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="flex rounded-full border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
                !isYearly
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={`flex items-center gap-2 rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
                isYearly
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  isYearly
                    ? "bg-green-600 text-white dark:bg-green-500"
                    : "bg-green-600/10 text-green-600 dark:bg-green-500/15 dark:text-green-400"
                }`}
              >
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const limits = getPlanLimits(
              plan.name.toLowerCase() as "pro" | "business",
            );
            const displayPrice = isYearly
              ? plan.yearlyPrice
              : plan.monthlyPrice;

            return (
              <div
                key={plan.name}
                className={`flex flex-col rounded-xl border p-6 ${
                  plan.highlighted
                    ? "border-indigo-400/50 bg-gradient-to-b from-indigo-50 to-card ring-1 ring-indigo-400/20 dark:border-indigo-500/40 dark:from-indigo-950/20 dark:to-card dark:ring-indigo-500/10"
                    : "border-border"
                }`}
              >
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {plan.audience}
                </p>
                <div className="mt-4">
                  <p className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight">
                      {displayPrice}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /month
                    </span>
                  </p>
                  {isYearly && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      billed annually at {plan.yearlyTotal}/yr
                    </p>
                  )}
                  {isYearly && (
                    <span className="mt-1.5 inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                      Save {plan.yearlySavings}/yr
                    </span>
                  )}
                </div>
                <ul className="mt-5 flex-1 space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2.5">
                    <CheckIcon />
                    {limits.sessionsPerMonth.toLocaleString()} sessions/month
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckIcon />
                    {limits.retentionDays} day retention
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckIcon />
                    Hash chain verification
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckIcon />
                    Anchored on Sigstore Rekor
                  </li>
                </ul>
                <Button
                  className="mt-6 w-full"
                  loading={pending}
                  onClick={() => handleUpgrade(plan)}
                  variant={plan.highlighted ? "primary" : "secondary"}
                >
                  Get {plan.name}
                </Button>
              </div>
            );
          })}

          {/* Enterprise */}
          <div className="flex flex-col rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold">Enterprise</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              For regulated industries and large-scale deployments.
            </p>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight">Custom</p>
            </div>
            <ul className="mt-5 flex-1 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2.5">
                <CheckIcon />
                Unlimited sessions
              </li>
              <li className="flex items-center gap-2.5">
                <CheckIcon />
                Custom retention (up to 7 years)
              </li>
              <li className="flex items-center gap-2.5">
                <CheckIcon />
                Hash chain verification
              </li>
              <li className="flex items-center gap-2.5">
                <CheckIcon />
                Anchored on Sigstore Rekor
              </li>
            </ul>
            <a
              href="mailto:sales@agentreceipt.com"
              className="mt-6 block w-full rounded-lg border border-border py-2.5 text-center text-sm font-semibold text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              Contact sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-green-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
