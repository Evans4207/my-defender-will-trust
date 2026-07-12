import type { PackageKey, PartyType } from "@/lib/pricing";

/**
 * Maps our internal plans to Stripe Price IDs (from env). Packages (will/trust)
 * are ONE-TIME purchases (Checkout mode "payment"); membership is a recurring
 * subscription (mode "subscription"). Price IDs are created in the Stripe
 * dashboard and set per environment.
 */

export type PlanKey = "will" | "trust" | "membership";

export function packagePriceId(pkg: PackageKey, party: PartyType): string | undefined {
  const map: Record<PackageKey, Record<PartyType, string | undefined>> = {
    will: {
      individual: process.env.STRIPE_PRICE_WILL_INDIVIDUAL,
      couples: process.env.STRIPE_PRICE_WILL_COUPLES,
    },
    trust: {
      individual: process.env.STRIPE_PRICE_TRUST_INDIVIDUAL,
      couples: process.env.STRIPE_PRICE_TRUST_COUPLES,
    },
  };
  return map[pkg][party];
}

export function membershipPriceId(): string | undefined {
  return process.env.STRIPE_PRICE_MEMBERSHIP;
}

/** Checkout mode for a given plan. */
export function checkoutMode(plan: PlanKey): "payment" | "subscription" {
  return plan === "membership" ? "subscription" : "payment";
}
