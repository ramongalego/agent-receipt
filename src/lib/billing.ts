import { eq, and, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, agentSessions, projects } from "@/db/schema";

export const MAX_EVENTS_PER_SESSION = 200;

export type PlanName = "free" | "pro" | "business";

type PlanLimits = {
  sessionsPerMonth: number;
  retentionDays: number;
};

const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: { sessionsPerMonth: 100, retentionDays: 7 },
  pro: { sessionsPerMonth: 5_000, retentionDays: 90 },
  business: { sessionsPerMonth: 50_000, retentionDays: 365 },
};

// Map Stripe price IDs to plan names. Set actual values in env.
const PRICE_TO_PLAN: Record<string, PlanName> = {
  [process.env.STRIPE_PRICE_PRO ?? "price_pro"]: "pro",
  [process.env.STRIPE_PRICE_BUSINESS ?? "price_business"]: "business",
};

export function getPlanLimits(plan: PlanName): PlanLimits {
  return PLAN_LIMITS[plan];
}

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
    .where(
      and(
        eq(projects.userId, userId),
        gte(agentSessions.startedAt, startOfMonth),
      ),
    );

  return result[0]?.count ?? 0;
}

export async function isOverLimit(userId: string): Promise<boolean> {
  const user = await db
    .select({
      stripePriceId: users.stripePriceId,
      stripeCurrentPeriodEnd: users.stripeCurrentPeriodEnd,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!user) return true;

  const plan = getUserPlan(user);
  const limits = getPlanLimits(plan);
  const usage = await getUsageThisMonth(userId);

  return usage >= limits.sessionsPerMonth;
}
