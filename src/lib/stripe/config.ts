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

/**
 * True when Stripe is configured enough to attempt a checkout. Used to render
 * disabled CTAs (with an explanation) instead of throwing while Stripe is not
 * yet set up — e.g. during the pre-launch test phase.
 */
export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Couples/mirror documents cannot yet be generated (interview schema has no
 * second-testator branch), so the couples tier is disabled — selling it would
 * be a sale we can't fulfil. Checkout is restricted to `individual` until mirror
 * documents ship AND counsel clears the new document types.
 *
 * Re-enabling is a deliberate revert: delete this guard, restore the couples
 * CheckoutButtons in the gate page, and the couples price displays on the
 * marketing page. The couples price ids in this file are left intact on purpose.
 */
export function assertPartyAvailable(rawParty: string): PartyType {
  if (rawParty !== "individual") {
    throw new Error("Couples packages are not currently available.");
  }
  return "individual";
}
