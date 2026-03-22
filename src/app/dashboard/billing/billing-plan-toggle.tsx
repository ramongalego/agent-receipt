"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { getPlanLimits } from "@/lib/billing-plans";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "./actions";

type Plan = {
  name: "Free" | "Pro" | "Business";
  monthlyPrice: string;
  yearlyPrice?: string;
  yearlyTotal?: string;
  yearlySavings?: string;
  monthlyPriceId: string | null;
  yearlyPriceId: string | null;
};

type BillingPlanToggleProps = {
  plans: Plan[];
  currentPlan: string;
};

export function BillingPlanToggle({
  plans,
  currentPlan,
}: BillingPlanToggleProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleUpgrade(priceId: string | null) {
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
    <>
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsYearly(false)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !isYearly
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setIsYearly(true)}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            isYearly
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Yearly
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
            Save 20%
          </span>
        </button>
      </div>
      <p className="mb-5 text-xs text-muted-foreground">
        Annual billing available at checkout.
      </p>
      <div className="grid gap-5 sm:grid-cols-4">
        {plans.map((p) => {
          const planKey = p.name.toLowerCase() as "free" | "pro" | "business";
          const planLimits = getPlanLimits(planKey);
          const isCurrent = currentPlan === planKey;
          const showYearly = isYearly && p.yearlyPrice;
          const displayPrice = showYearly ? p.yearlyPrice : p.monthlyPrice;

          return (
            <Card
              key={p.name}
              className={
                isCurrent
                  ? "ring-2 ring-accent"
                  : "transition-colors hover:border-muted-foreground/30"
              }
            >
              <CardContent>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-card-foreground">
                    {p.name}
                  </h3>
                  {isCurrent && <Badge variant="default">Current</Badge>}
                </div>
                <p className="mt-2 text-2xl font-bold text-card-foreground">
                  {displayPrice}
                </p>
                {showYearly && p.yearlyTotal && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    billed at {p.yearlyTotal}
                  </p>
                )}
                {showYearly && p.yearlySavings && (
                  <span className="mt-1.5 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                    {p.yearlySavings}
                  </span>
                )}
                <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckIcon />
                    {planLimits.sessionsPerMonth.toLocaleString("en-US")}{" "}
                    sessions/month
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon />
                    {planLimits.retentionDays} day retention
                  </li>
                </ul>
                {!isCurrent && planKey !== "free" && (
                  <Button
                    className="mt-5 w-full"
                    size="sm"
                    loading={pending}
                    onClick={() =>
                      handleUpgrade(
                        isYearly ? p.yearlyPriceId : p.monthlyPriceId,
                      )
                    }
                  >
                    Upgrade to {p.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Enterprise */}
        <Card className="transition-colors hover:border-muted-foreground/30">
          <CardContent>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-card-foreground">
                Enterprise
              </h3>
            </div>
            <p className="mt-2 text-2xl font-bold text-card-foreground">
              Custom
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckIcon />
                Unlimited sessions
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                Custom retention (up to 7 years)
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
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
