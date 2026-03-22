/**
 * @jest-environment node
 */
const mockWhere = jest.fn().mockResolvedValue(undefined);
const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });
const mockConstructEvent = jest.fn();
const mockSubscriptionsRetrieve = jest.fn();

jest.mock("@/db", () => ({
  db: { update: (...args: unknown[]) => mockUpdate(...args) },
}));
jest.mock("@/db/schema", () => ({ users: {} }));
jest.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
    subscriptions: {
      retrieve: (...args: unknown[]) => mockSubscriptionsRetrieve(...args),
    },
  },
}));
jest.mock("drizzle-orm", () => ({
  eq: jest.fn((...args: unknown[]) => args),
}));

import { NextRequest } from "next/server";
import { POST } from "./route";

function makeRequest(options?: { signature?: string | null; body?: string }) {
  const headers: Record<string, string> = {};
  if (options?.signature !== null && options?.signature !== undefined) {
    headers["stripe-signature"] = options.signature;
  }
  return new NextRequest("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers,
    body: options?.body ?? "raw body",
  });
}

function makeEvent(type: string, object: Record<string, unknown>) {
  return {
    type,
    data: { object },
  };
}

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSet.mockReturnValue({ where: mockWhere });
    mockUpdate.mockReturnValue({ set: mockSet });
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const request = makeRequest({ signature: null });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Missing Stripe signature.");
    expect(json.code).toBe("MISSING_SIGNATURE");
  });

  it("returns 400 when stripe signature is invalid", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const request = makeRequest({ signature: "sig_invalid" });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid Stripe signature.");
    expect(json.code).toBe("INVALID_SIGNATURE");
  });

  it("checkout.session.completed sets plan on user", async () => {
    const periodEnd = Math.floor(Date.now() / 1000) + 86400;
    const event = makeEvent("checkout.session.completed", {
      mode: "subscription",
      customer: "cus_456",
      subscription: "sub_123",
      metadata: { userId: "user_789" },
    });
    mockConstructEvent.mockReturnValue(event);
    mockSubscriptionsRetrieve.mockResolvedValue({
      items: {
        data: [
          {
            price: { id: "price_pro" },
            current_period_end: periodEnd,
          },
        ],
      },
    });

    const request = makeRequest({ signature: "sig_test" });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.received).toBe(true);

    expect(mockSubscriptionsRetrieve).toHaveBeenCalledWith("sub_123");
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith({
      stripeCustomerId: "cus_456",
      stripeSubscriptionId: "sub_123",
      stripePriceId: "price_pro",
      stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
    });
    expect(mockWhere).toHaveBeenCalled();
  });

  it("subscription updated sets new price and period on user", async () => {
    const periodEnd = Math.floor(Date.now() / 1000) + 86400 * 30;
    const event = makeEvent("customer.subscription.updated", {
      id: "sub_123",
      customer: "cus_456",
      items: {
        data: [
          {
            price: { id: "price_business" },
            current_period_end: periodEnd,
          },
        ],
      },
    });
    mockConstructEvent.mockReturnValue(event);

    const request = makeRequest({ signature: "sig_test" });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.received).toBe(true);

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith({
      stripeSubscriptionId: "sub_123",
      stripePriceId: "price_business",
      stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
    });
    expect(mockWhere).toHaveBeenCalled();
  });

  it("subscription updated with no items returns 200 without crashing", async () => {
    const event = makeEvent("customer.subscription.updated", {
      id: "sub_123",
      customer: "cus_456",
      items: { data: [] },
    });
    mockConstructEvent.mockReturnValue(event);

    const request = makeRequest({ signature: "sig_test" });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.received).toBe(true);

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith({
      stripeSubscriptionId: "sub_123",
      stripePriceId: null,
      stripeCurrentPeriodEnd: expect.any(Date),
    });
  });

  it("subscription deleted downgrades to free", async () => {
    const event = makeEvent("customer.subscription.deleted", {
      id: "sub_123",
      customer: "cus_456",
      items: { data: [] },
    });
    mockConstructEvent.mockReturnValue(event);

    const request = makeRequest({ signature: "sig_test" });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.received).toBe(true);

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith({
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    });
    expect(mockWhere).toHaveBeenCalled();
  });
});
