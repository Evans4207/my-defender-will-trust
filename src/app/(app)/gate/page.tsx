import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getEntitlement, getPendingDiscount } from "@/lib/entitlements.server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/checkout-button";
import { stripeConfigured } from "@/lib/stripe/config";
import { formatUsd, LAUNCH_PRICES, applyDiscountCents } from "@/lib/pricing";

export const metadata: Metadata = { title: "Choose how to get started" };

const PACKAGE_LABEL = { will: "Will Package", trust: "Trust Package" } as const;

export default async function GatePage() {
  const entitlement = await getEntitlement();
  if (entitlement.unlocked) redirect("/dashboard");

  const pending = await getPendingDiscount();

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

      {!stripeConfigured() && (
        <div className="mb-6 rounded-lg border border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
          Card checkout is being set up and isn&rsquo;t available yet. You can
          still explore everything with a partner access code.
        </div>
      )}

      {pending && (
        <Card className="mb-6 border-accent bg-accent/10">
          <CardHeader>
            <h2 className="font-serif text-xl font-semibold">
              Your partner discount: {pending.discountPct}% off the{" "}
              {PACKAGE_LABEL[pending.package]}
            </h2>
            <p className="text-sm text-muted-foreground">
              Applied automatically at checkout.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Couples tier disabled until mirror documents ship (see config.ts). */}
            {(["individual"] as const).map((party) => {
              const list = LAUNCH_PRICES[pending.package][party];
              const discounted = applyDiscountCents(list, pending.discountPct);
              return (
                <div key={party} className="flex items-center justify-between gap-4">
                  <p className="text-sm">
                    <span className="capitalize">{party}</span>:{" "}
                    <span className="text-muted-foreground line-through">
                      {formatUsd(list)}
                    </span>{" "}
                    <span className="font-semibold">{formatUsd(discounted)}</span>
                  </p>
                  <CheckoutButton
                    plan={pending.package}
                    party={party}
                    className="bg-accent text-accent-foreground hover:bg-brand-gold-bright"
                  >
                    Check out ({party})
                  </CheckoutButton>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

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
              <CheckoutButton plan="will" party="individual" className="w-full">
                Get the Will Package
              </CheckoutButton>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Trust Package · {formatUsd(LAUNCH_PRICES.trust.individual)} individual
              </p>
              <CheckoutButton
                plan="trust"
                party="individual"
                className="w-full bg-accent text-accent-foreground hover:bg-brand-gold-bright"
              >
                Get the Trust Package
              </CheckoutButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
