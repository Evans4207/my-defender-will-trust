import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEntitlement } from "@/lib/entitlements.server";
import { getMatter } from "@/lib/interview/data";
import { createClient } from "@/lib/supabase/server";
import { MembershipUpsell } from "@/components/membership-upsell";
import { FundingList, type FundingItem } from "@/components/funding/funding-list";
import { AddFundingForm } from "@/components/funding/add-funding-form";
import { prefillFundingFromAssetsAction } from "@/lib/funding/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Trust funding tracker" };

export default async function FundingPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;

  const entitlement = await getEntitlement();
  if (!entitlement.membership) {
    return <MembershipUpsell feature="The trust funding tracker" />;
  }

  const matter = await getMatter(matterId);
  if (!matter) redirect("/dashboard");

  const supabase = await createClient();
  const { data } = await supabase
    .from("funding_items")
    .select("id, asset_label, category, retitled")
    .eq("matter_id", matterId)
    .order("created_at", { ascending: true });
  const items = (data as FundingItem[] | null) ?? [];
  const done = items.filter((i) => i.retitled).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Trust funding tracker</h1>
        <p className="mt-1 text-muted-foreground">
          A trust only works when it&apos;s funded. Track each asset you retitle
          into your trust. {items.length > 0 && `${done} of ${items.length} complete.`}
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold">Assets to retitle</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <FundingList matterId={matterId} items={items} />
          {items.length === 0 && (
            <form action={prefillFundingFromAssetsAction.bind(null, matterId)}>
              <Button type="submit" variant="outline">
                Import from my interview assets
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold">Add an asset</h2>
        </CardHeader>
        <CardContent>
          <AddFundingForm matterId={matterId} />
        </CardContent>
      </Card>
    </div>
  );
}
