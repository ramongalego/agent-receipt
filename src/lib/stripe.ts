import Stripe from "stripe";

// Pin the API version so Stripe can't break us by silently upgrading schemas.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});
