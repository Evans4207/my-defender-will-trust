import { CheckoutButton } from "@/components/checkout-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatUsd, LAUNCH_PRICES } from "@/lib/pricing";
import { Shield } from "@/components/brand/shield";

/** Shown in place of a member-only feature when the user isn't a member. */
export function MembershipUpsell({ feature }: { feature: string }) {
  return (
    <Card className="mx-auto max-w-lg border-accent/50 bg-accent/5">
      <CardHeader>
        <div className="mb-2 flex justify-center">
          <Shield className="h-10 w-auto text-accent" />
        </div>
        <h1 className="text-center font-serif text-2xl font-semibold">
          {feature} is a member feature
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          Join for {formatUsd(LAUNCH_PRICES.membership.annual)}/year to unlock
          unlimited updates, your secure document vault, annual estate checkups,
          and the trust funding tracker.
        </p>
      </CardHeader>
      <CardContent className="flex justify-center">
        <CheckoutButton
          plan="membership"
          className="bg-accent text-accent-foreground hover:bg-brand-gold-bright"
        >
          Become a member — {formatUsd(LAUNCH_PRICES.membership.annual)}/yr
        </CheckoutButton>
      </CardContent>
    </Card>
  );
}
