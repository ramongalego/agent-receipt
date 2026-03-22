/**
 * @jest-environment node
 */

const mockAuth = jest.fn();
const mockStripeCheckoutCreate = jest.fn();
const mockStripeCustomersCreate = jest.fn();
const mockDbSelect = jest.fn();
const mockDbUpdate = jest.fn();

jest.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));
jest.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockStripeCheckoutCreate(...args),
      },
    },
    customers: {
      create: (...args: unknown[]) => mockStripeCustomersCreate(...args),
    },
  },
}));
jest.mock("@/db", () => ({
  db: {
    select: () => {
      mockDbSelect();
      return {
        from: () => ({
          where: () => ({
            limit: () => ({
              then: (fn: (rows: unknown[]) => unknown) =>
                Promise.resolve(
                  fn([{ stripeCustomerId: "cus_123", email: "a@b.com" }]),
                ),
            }),
          }),
        }),
      };
    },
    update: () => {
      mockDbUpdate();
      return {
        set: () => ({ where: () => Promise.resolve() }),
      };
    },
  },
}));
jest.mock("@/db/schema", () => ({ users: {} }));
jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
}));

// Set allowed price IDs before importing the module
process.env.STRIPE_PRICE_PRO_MONTHLY = "price_pro_test";
process.env.STRIPE_PRICE_PRO_YEARLY = "price_pro_yearly_test";
process.env.STRIPE_PRICE_BUSINESS_MONTHLY = "price_biz_test";
process.env.STRIPE_PRICE_BUSINESS_YEARLY = "price_biz_yearly_test";

import { createCheckoutSession } from "./actions";

describe("createCheckoutSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user_1" } });
  });

  it("rejects an invalid price ID without calling Stripe", async () => {
    const result = await createCheckoutSession("price_attacker_fake");

    expect(result).toEqual({
      error: "Invalid plan.",
      code: "INVALID_PRICE_ID",
    });
    expect(mockStripeCheckoutCreate).not.toHaveBeenCalled();
  });

  it("rejects an empty price ID", async () => {
    const result = await createCheckoutSession("");

    expect(result).toEqual({
      error: "Invalid plan.",
      code: "INVALID_PRICE_ID",
    });
    expect(mockStripeCheckoutCreate).not.toHaveBeenCalled();
  });

  it("accepts a valid price ID", async () => {
    mockStripeCheckoutCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/test",
    });

    const result = await createCheckoutSession("price_pro_test");

    expect(mockStripeCheckoutCreate).toHaveBeenCalled();
    expect(result).toEqual({
      data: { url: "https://checkout.stripe.com/test" },
    });
  });
});
