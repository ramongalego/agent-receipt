"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { users } from "@/db/schema";

export type CheckoutPlan = "pro" | "business";
export type CheckoutInterval = "monthly" | "yearly";

// Price IDs stay on the server. The client only says which plan it wants.
function priceIdFor(
  plan: CheckoutPlan,
  interval: CheckoutInterval,
): string | undefined {
  const prices: Record<
    CheckoutPlan,
    Record<CheckoutInterval, string | undefined>
  > = {
    pro: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    },
    business: {
      monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
      yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY,
    },
  };
  return prices[plan]?.[interval];
}

export async function createCheckoutSession(
  plan: CheckoutPlan,
  interval: CheckoutInterval,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: "You're signed out. Sign in and try again.",
      code: "UNAUTHORIZED",
    };
  }

  const priceId =
    (plan === "pro" || plan === "business") &&
    (interval === "monthly" || interval === "yearly")
      ? priceIdFor(plan, interval)
      : undefined;

  if (!priceId) {
    return {
      error: "That plan isn't available. Refresh the page and try again.",
      code: "INVALID_PRICE_ID",
    };
  }

  const user = await db
    .select({
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)
    .then((rows) => rows[0]);

  // A second checkout would start a second subscription billed alongside
  // the first. Plan changes go through the billing portal instead.
  if (user?.stripeSubscriptionId) {
    return {
      error:
        "You already have a subscription. Use Manage billing to change plans.",
      code: "ALREADY_SUBSCRIBED",
    };
  }

  let customerId = user?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;

    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, session.user.id));
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
    metadata: { userId: session.user.id },
  });

  return { data: { url: checkoutSession.url } };
}

export async function createPortalSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: "You're signed out. Sign in and try again.",
      code: "UNAUTHORIZED",
    };
  }

  const user = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!user?.stripeCustomerId) {
    return { error: "No billing account found.", code: "NO_CUSTOMER" };
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  });

  return { data: { url: portalSession.url } };
}
