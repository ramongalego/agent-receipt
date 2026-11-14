"use client";

import { useState } from "react";
import Link from "next/link";

type PlanData = {
  name: string;
  price: string;
  period: string;
  plan: string;
  cta: string;
  href: string;
  audience: string;
  highlighted?: boolean;
  yearlyPrice?: string;
  yearlyTotal?: string;
  yearlySavings?: string;
  sessionsPerMonth: number;
  retentionDays: number;
};

type PricingCardsProps = {
  plans: PlanData[];
};

function CheckSvg({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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
}

export function PricingCards({ plans }: PricingCardsProps) {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <>
      <div className="mb-20 flex items-center justify-center gap-3">
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
                  : "bg-green-600/10 text-green-700 dark:bg-green-500/15 dark:text-green-400"
              }`}
            >
              Save 20%
            </span>
          </button>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {plans.map((plan) => {
          const showYearly = isYearly && plan.yearlyPrice;
          const displayPrice = showYearly ? plan.yearlyPrice : plan.price;
          const displayPeriod = showYearly ? "/month" : plan.period;
          return (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                plan.highlighted
                  ? "border-indigo-500/50 bg-card dark:border-indigo-500/40"
                  : "border-border bg-card"
              }`}
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-pretty text-xs text-muted-foreground">
                {plan.audience}
              </p>
              <div className="mt-4">
                <p className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {displayPrice}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {displayPeriod}
                  </span>
                </p>
                {showYearly && plan.yearlyTotal && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    billed annually at {plan.yearlyTotal}
                  </p>
                )}
                {showYearly && plan.yearlySavings && (
                  <span className="mt-2 inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                    Save {plan.yearlySavings}/yr
                  </span>
                )}
              </div>
              <ul className="mt-8 flex-1 space-y-4 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <CheckSvg />
                  {plan.sessionsPerMonth.toLocaleString()} sessions/month
                </li>
                <li className="flex items-center gap-3">
                  <CheckSvg />
                  {plan.retentionDays} day retention
                </li>
                <li className="flex items-center gap-3">
                  <CheckSvg />
                  Hash chain verification
                </li>
                {plan.plan !== "free" && (
                  <li className="flex items-center gap-3">
                    <CheckSvg />
                    Anchored on Sigstore Rekor
                  </li>
                )}
                <li className="flex items-center gap-3">
                  <CheckSvg />
                  Unlimited projects
                </li>
              </ul>
              <Link
                href={plan.href}
                className={`mt-10 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          );
        })}
      </div>

      {/* Enterprise, horizontal banner, sits outside the plan grid */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h3 className="text-lg font-semibold">Enterprise</h3>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              For regulated industries and large-scale deployments.
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <CheckSvg size={12} />
                Unlimited sessions
              </li>
              <li className="flex items-center gap-1.5">
                <CheckSvg size={12} />
                Custom retention (up to 7 years)
              </li>
              <li className="flex items-center gap-1.5">
                <CheckSvg size={12} />
                Hash chain verification
              </li>
              <li className="flex items-center gap-1.5">
                <CheckSvg size={12} />
                Anchored on Sigstore Rekor
              </li>
              <li className="flex items-center gap-1.5">
                <CheckSvg size={12} />
                Unlimited projects
              </li>
            </ul>
          </div>
          <Link
            href="mailto:sales@agentreceipt.co"
            className="group inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-foreground/30"
          >
            Contact sales
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
      </div>
    </>
  );
}
