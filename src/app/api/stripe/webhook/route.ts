import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { users } from "@/db/schema";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature.", code: "MISSING_SIGNATURE" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe signature.", code: "INVALID_SIGNATURE" },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const firstItem = subscription.items.data[0];
      const priceId = firstItem?.price?.id ?? null;
      const currentPeriodEnd = firstItem?.current_period_end
        ? new Date(firstItem.current_period_end * 1000)
        : new Date();

      await db
        .update(users)
        .set({
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          stripeCurrentPeriodEnd: currentPeriodEnd,
        })
        .where(eq(users.stripeCustomerId, customerId));

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      await db
        .update(users)
        .set({
          stripeSubscriptionId: null,
          stripePriceId: null,
          stripeCurrentPeriodEnd: null,
        })
        .where(eq(users.stripeCustomerId, customerId));

      break;
    }
  }

  return NextResponse.json({ data: { received: true } });
}
