import "server-only";
import Stripe from "stripe";

let cached: Stripe | null = null;

/** Lazily-constructed Stripe client. Throws if the secret key is unset. */
export function getStripe(): Stripe {
  if (!cached) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set. Configure Stripe before using checkout/webhooks.",
      );
    }
    cached = new Stripe(key);
  }
  return cached;
}
