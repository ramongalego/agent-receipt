export const MAX_EVENTS_PER_SESSION = 200;

export type PlanName = "free" | "pro" | "business";

type PlanLimits = {
  sessionsPerMonth: number;
  retentionDays: number;
};

const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: { sessionsPerMonth: 100, retentionDays: 7 },
  pro: { sessionsPerMonth: 2_500, retentionDays: 90 },
  business: { sessionsPerMonth: 15_000, retentionDays: 365 },
};

export function getPlanLimits(plan: PlanName): PlanLimits {
  return PLAN_LIMITS[plan];
}
