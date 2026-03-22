import { eq, and, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, agentSessions, projects, teams } from "@/db/schema";

// Re-export from billing-plans so server-side consumers can import from one place
export {
  MAX_EVENTS_PER_SESSION,
  getPlanLimits,
  type PlanName,
} from "./billing-plans";
import {
  type PlanName,
  getPlanLimits as _getPlanLimits,
} from "./billing-plans";
// Use local alias for internal use (re-export handles external consumers)
const getPlanLimits = _getPlanLimits;

// Map Stripe price IDs to plan names. Supports monthly and yearly variants.
const PRICE_TO_PLAN: Record<string, PlanName> = Object.fromEntries(
  [
    [process.env.STRIPE_PRICE_PRO_MONTHLY, "pro"],
    [process.env.STRIPE_PRICE_PRO_YEARLY, "pro"],
    [process.env.STRIPE_PRICE_BUSINESS_MONTHLY, "business"],
    [process.env.STRIPE_PRICE_BUSINESS_YEARLY, "business"],
  ].filter(([key]) => key) as [string, PlanName][],
);

export function getPlanFromPriceId(priceId: string): PlanName {
  return PRICE_TO_PLAN[priceId] ?? "free";
}

export function getUserPlan(user: {
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: Date | null;
}): PlanName {
  if (!user.stripePriceId || !user.stripeCurrentPeriodEnd) {
    return "free";
  }
  if (user.stripeCurrentPeriodEnd < new Date()) {
    return "free";
  }
  return PRICE_TO_PLAN[user.stripePriceId] ?? "free";
}

export async function getUsageThisMonth(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const result = await db
    .select({ count: sql<number>`cast(count(${agentSessions.id}) as int)` })
    .from(agentSessions)
    .innerJoin(projects, eq(projects.id, agentSessions.projectId))
    .innerJoin(teams, eq(teams.id, projects.teamId))
    .where(
      and(
        eq(teams.ownerId, userId),
        gte(agentSessions.startedAt, startOfMonth),
      ),
    );

  return result[0]?.count ?? 0;
}

export async function isOverLimit(userId: string): Promise<boolean> {
  const [user, usage] = await Promise.all([
    db
      .select({
        stripePriceId: users.stripePriceId,
        stripeCurrentPeriodEnd: users.stripeCurrentPeriodEnd,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    getUsageThisMonth(userId),
  ]);

  if (!user) return true;

  const plan = getUserPlan(user);
  const limits = getPlanLimits(plan);

  return usage >= limits.sessionsPerMonth;
}
