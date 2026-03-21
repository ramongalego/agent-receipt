// Test pure functions only. DB-dependent functions (getUsageThisMonth, isOverLimit)
// are tested via integration tests with a real database.

// We need to mock the db module to prevent neon from loading in jsdom
jest.mock("@/db", () => ({}));
jest.mock("@/db/schema", () => ({}));

import { getPlanLimits, getUserPlan } from "./billing";

describe("getPlanLimits", () => {
  it("returns correct limits for free plan", () => {
    expect(getPlanLimits("free")).toEqual({
      sessionsPerMonth: 100,
      retentionDays: 7,
    });
  });

  it("returns correct limits for pro plan", () => {
    expect(getPlanLimits("pro")).toEqual({
      sessionsPerMonth: 2_500,
      retentionDays: 90,
    });
  });

  it("returns correct limits for business plan", () => {
    expect(getPlanLimits("business")).toEqual({
      sessionsPerMonth: 15_000,
      retentionDays: 365,
    });
  });
});

describe("getUserPlan", () => {
  it("returns free when no stripePriceId", () => {
    const plan = getUserPlan({
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    });
    expect(plan).toBe("free");
  });

  it("returns free when subscription expired", () => {
    const plan = getUserPlan({
      stripePriceId: "price_pro",
      stripeCurrentPeriodEnd: new Date("2020-01-01"),
    });
    expect(plan).toBe("free");
  });

  it("returns free when priceId is unrecognized", () => {
    const plan = getUserPlan({
      stripePriceId: "price_unknown",
      stripeCurrentPeriodEnd: new Date("2030-01-01"),
    });
    expect(plan).toBe("free");
  });
});
