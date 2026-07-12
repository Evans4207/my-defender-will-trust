import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getEntitlement } from "@/lib/entitlements.server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/checkout-button";
import { formatUsd, LAUNCH_PRICES } from "@/lib/pricing";

export const metadata: Metadata = { title: "Choose how to get started" };

export default async function GatePage() {
  const entitlement = await getEntitlement();
  if (entitlement.unlocked) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-semibold">
          How would you like to get started?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Redeem a partner access code, or choose a package.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Access-code path */}
        <Card className="flex flex-col">
          <CardHeader>
            <h2 className="font-serif text-xl font-semibold">
              I have an access code
            </h2>
            <p className="text-sm text-muted-foreground">
              From an affiliated company (a law firm, tax resolution client base,
              etc.).
            </p>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button render={<Link href="/redeem" />} className="w-full">
              Enter access code
            </Button>
          </CardContent>
        </Card>

        {/* Subscribe path */}
        <Card className="flex flex-col border-accent/60">
          <CardHeader>
            <h2 className="font-serif text-xl font-semibold">
              Choose a package
            </h2>
            <p className="text-sm text-muted-foreground">
              Pay once and start immediately.
            </p>
          </CardHeader>
          <CardContent className="mt-auto space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Will Package · {formatUsd(LAUNCH_PRICES.will.individual)} individual
              </p>
              <div className="flex gap-2">
                <CheckoutButton plan="will" party="individual" className="flex-1">
                  Individual
                </CheckoutButton>
                <CheckoutButton
                  plan="will"
                  party="couples"
                  variant="outline"
                  className="flex-1"
                >
                  Couples
                </CheckoutButton>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Trust Package · {formatUsd(LAUNCH_PRICES.trust.individual)} individual
              </p>
              <div className="flex gap-2">
                <CheckoutButton
                  plan="trust"
                  party="individual"
                  className="flex-1 bg-accent text-accent-foreground hover:bg-brand-gold-bright"
                >
                  Individual
                </CheckoutButton>
                <CheckoutButton
                  plan="trust"
                  party="couples"
                  variant="outline"
                  className="flex-1"
                >
                  Couples
                </CheckoutButton>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
