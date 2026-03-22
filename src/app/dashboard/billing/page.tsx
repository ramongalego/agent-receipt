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
import { BillingPlanToggle } from "./billing-plan-toggle";

export const metadata: Metadata = {
  title: "Billing",
};

const PLANS = [
  {
    name: "Free" as const,
    monthlyPrice: "$0/month",
    monthlyPriceId: null,
    yearlyPriceId: null,
  },
  {
    name: "Pro" as const,
    monthlyPrice: "$49/month",
    yearlyPrice: "$39/month",
    yearlyTotal: "$470/year",
    yearlySavings: "Save $118/yr",
    monthlyPriceId: process.env.STRIPE_PRICE_PRO_MONTHLY || null,
    yearlyPriceId: process.env.STRIPE_PRICE_PRO_YEARLY || null,
  },
  {
    name: "Business" as const,
    monthlyPrice: "$199/month",
    yearlyPrice: "$159/month",
    yearlyTotal: "$1,910/year",
    yearlySavings: "Save $478/yr",
    monthlyPriceId: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || null,
    yearlyPriceId: process.env.STRIPE_PRICE_BUSINESS_YEARLY || null,
  },
];

export default async function BillingPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [user, usage] = await Promise.all([
    db
      .select({
        stripePriceId: users.stripePriceId,
        stripeCustomerId: users.stripeCustomerId,
        stripeCurrentPeriodEnd: users.stripeCurrentPeriodEnd,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]!),
    getUsageThisMonth(userId),
  ]);

  const plan = getUserPlan(user);
  const limits = getPlanLimits(plan);
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
        <BillingPlanToggle plans={PLANS} currentPlan={plan} />
      </div>
    </div>
  );
}
