import { startCheckoutAction } from "@/lib/stripe/actions";
import { Button } from "@/components/ui/button";
import type { PlanKey } from "@/lib/stripe/config";
import type { PartyType } from "@/lib/pricing";

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
