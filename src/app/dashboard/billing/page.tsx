import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getUserPlan, getPlanLimits, getUsageThisMonth } from "@/lib/billing";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpgradeButton } from "./upgrade-button";
import { ManageBillingButton } from "./manage-billing-button";

export const metadata: Metadata = {
  title: "Billing",
};

const PLANS = [
  { name: "Free" as const, price: "$0/month", priceId: null },
  {
    name: "Pro" as const,
    price: "$29/month",
    priceId: process.env.STRIPE_PRICE_PRO ?? "",
  },
  {
    name: "Business" as const,
    price: "$99/month",
    priceId: process.env.STRIPE_PRICE_BUSINESS ?? "",
  },
];

export default async function BillingPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const user = await db
    .select({
      stripePriceId: users.stripePriceId,
      stripeCustomerId: users.stripeCustomerId,
      stripeCurrentPeriodEnd: users.stripeCurrentPeriodEnd,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0]!);

  const plan = getUserPlan(user);
  const limits = getPlanLimits(plan);
  const usage = await getUsageThisMonth(userId);
  const usagePercent = Math.min(
    100,
    Math.round((usage / limits.sessionsPerMonth) * 100),
  );

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-2xl font-bold text-foreground">Billing</h1>

        {/* Current plan */}
        <Card className="mb-10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-card-foreground">
                Current plan
              </h2>
              <Badge variant={plan === "free" ? "default" : "success"}>
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Sessions this month
                </span>
                <span className="font-medium text-foreground">
                  {usage.toLocaleString("en-US")} /{" "}
                  {limits.sessionsPerMonth.toLocaleString("en-US")}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    usagePercent >= 90
                      ? "bg-red-500"
                      : usagePercent >= 70
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Data retained for {limits.retentionDays} days.
            </p>

            <div className="mt-5">
              {plan === "free" ? <UpgradeButton /> : <ManageBillingButton />}
            </div>
          </CardContent>
        </Card>

        {/* Plan comparison */}
        <div className="mb-5 flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">Plans</h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid gap-5 sm:grid-cols-4">
          {PLANS.map((p) => {
            const planKey = p.name.toLowerCase() as "free" | "pro" | "business";
            const planLimits = getPlanLimits(planKey);
            const isCurrent = plan === planKey;

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
                    {p.price}
                  </p>
                  <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 shrink-0 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      {planLimits.sessionsPerMonth.toLocaleString("en-US")}{" "}
                      sessions/month
                    </li>
                    <li className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 shrink-0 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      {planLimits.retentionDays} day retention
                    </li>
                  </ul>
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
                  <svg
                    className="h-4 w-4 shrink-0 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited sessions
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 shrink-0 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Custom retention (up to 7 years)
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
