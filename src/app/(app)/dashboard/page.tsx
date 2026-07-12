import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getEntitlement } from "@/lib/entitlements.server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/checkout-button";
import { openBillingPortalAction } from "@/lib/stripe/actions";
import { startMatterAction } from "@/lib/interview/actions";
import { formatUsd, LAUNCH_PRICES } from "@/lib/pricing";

export const metadata: Metadata = { title: "Dashboard" };

type MatterRow = {
  id: string;
  doc_type: string;
  state: string | null;
  status: string;
};

const PACKAGE_LABEL: Record<string, string> = {
  will: "Will Package",
  trust: "Trust Package",
};

export default async function DashboardPage() {
  const entitlement = await getEntitlement();
  if (!entitlement.unlocked) redirect("/gate");

  const supabase = await createClient();
  const { data: matters } = await supabase
    .from("matters")
    .select("id, doc_type, state, status")
    .order("created_at", { ascending: false });
  const matterRows = (matters as MatterRow[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Your dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          {entitlement.source === "code"
            ? "Unlocked with a partner access code."
            : "Thanks for your purchase."}
        </p>
      </div>

      {/* Entitlement + documents */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold">Your documents</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {entitlement.packages.map((pkg) => {
            const existing = matterRows.find((m) => m.doc_type === pkg);
            return (
              <Card key={pkg}>
                <CardHeader>
                  <h3 className="font-serif text-lg font-semibold">
                    {PACKAGE_LABEL[pkg] ?? pkg}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {existing
                      ? `Status: ${existing.status.replace(/_/g, " ")}`
                      : "Not started yet"}
                  </p>
                </CardHeader>
                <CardContent>
                  {pkg === "will" ? (
                    <div className="space-y-2">
                      <form action={startMatterAction}>
                        <input type="hidden" name="doc_type" value={pkg} />
                        <Button type="submit" className="w-full">
                          {existing ? "Resume interview" : "Start interview"}
                        </Button>
                      </form>
                      {existing &&
                        (existing.status === "ready_to_sign" ||
                          existing.status === "signed") && (
                          <Button
                            variant="outline"
                            className="w-full"
                            render={<Link href={`/interview/${existing.id}/documents`} />}
                          >
                            View documents
                          </Button>
                        )}
                    </div>
                  ) : (
                    <>
                      <Button disabled className="w-full">
                        Start interview
                      </Button>
                      <p className="mt-2 text-center text-xs text-muted-foreground">
                        Trust interview launches in a later release.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Membership */}
      <section>
        <Card className="border-accent/50 bg-accent/5">
          <CardHeader>
            <h2 className="font-serif text-xl font-semibold">
              {entitlement.membership
                ? "You're a member"
                : "Add annual membership"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {entitlement.membership
                ? "Unlimited updates, secure vault, annual checkup, and trust funding tracker."
                : `${formatUsd(LAUNCH_PRICES.membership.annual)}/year — unlimited updates, secure document vault, annual estate checkup, and trust funding tracker.`}
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {!entitlement.membership && (
              <CheckoutButton
                plan="membership"
                className="bg-accent text-accent-foreground hover:bg-brand-gold-bright"
              >
                Add membership — {formatUsd(LAUNCH_PRICES.membership.annual)}/yr
              </CheckoutButton>
            )}
            <form action={openBillingPortalAction}>
              <Button type="submit" variant="outline">
                Manage billing
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
