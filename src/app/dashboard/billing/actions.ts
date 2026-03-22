"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function createCheckoutSession(priceId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated.", code: "UNAUTHORIZED" };
  }

  const validPriceIds = [
    process.env.STRIPE_PRICE_PRO,
    process.env.STRIPE_PRICE_BUSINESS,
  ].filter(Boolean);

  if (!priceId || !validPriceIds.includes(priceId)) {
    return { error: "Invalid plan.", code: "INVALID_PRICE_ID" };
  }

  const user = await db
    .select({
      stripeCustomerId: users.stripeCustomerId,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)
    .then((rows) => rows[0]);

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
    return { error: "Not authenticated.", code: "UNAUTHORIZED" };
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
