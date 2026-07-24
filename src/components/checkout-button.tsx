import { startCheckoutAction } from "@/lib/stripe/actions";
import { Button } from "@/components/ui/button";
import {
  stripeConfigured,
  packagePriceId,
  membershipPriceId,
  type PlanKey,
} from "@/lib/stripe/config";
import type { PackageKey, PartyType } from "@/lib/pricing";

/** Submits a Stripe Checkout request for a specific plan + party type. */
export function CheckoutButton({
  plan,
  party = "individual",
  children,
  className,
  variant,
}: {
  plan: PlanKey;
  party?: PartyType;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
}) {
  // During the pre-launch test phase Stripe (and the price ids) may be unset.
  // Render a disabled control that explains itself, rather than letting the
  // checkout action throw a 500 when the button is clicked.
  const priceId =
    plan === "membership"
      ? membershipPriceId()
      : packagePriceId(plan as PackageKey, party);
  if (!stripeConfigured() || !priceId) {
    return (
      <Button
        type="button"
        variant={variant}
        className={className}
        disabled
        title="Card payments are being set up and aren't available yet."
      >
        {children}
      </Button>
    );
  }

  return (
    <form action={startCheckoutAction}>
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="party" value={party} />
      <Button type="submit" className={className} variant={variant}>
        {children}
      </Button>
    </form>
  );
}
