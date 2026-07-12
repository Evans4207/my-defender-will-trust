import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMatter } from "@/lib/interview/data";
import { createClient } from "@/lib/supabase/server";
import { FundingList, type FundingItem } from "@/components/funding/funding-list";
import { AddFundingForm } from "@/components/funding/add-funding-form";
import { prefillFundingFromAssetsAction } from "@/lib/funding/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ATTORNEY_REVIEW_REQUIRED } from "@/lib/legal";

export const metadata: Metadata = { title: "Trust funding tracker" };

// Retitling guidance (build plan §5 — funding guide). Placeholder content.
const RETITLING_GUIDE: { category: string; how: string }[] = [
  { category: "Real estate", how: "Record a new deed transferring the property from you to the trust (e.g. a grant or quitclaim deed) with your county recorder." },
  { category: "Bank & brokerage accounts", how: "Ask the institution to retitle the account in the name of the trust, or update the account's ownership paperwork." },
  { category: "Vehicles", how: "Retitle with your state DMV, or use a transfer-on-death (TOD) designation where available." },
  { category: "Business interests", how: "Assign your membership/partnership interest to the trust per the entity's operating/partnership agreement." },
  { category: "Beneficiary designations", how: "For retirement accounts and life insurance, review beneficiaries — often kept outside the trust. Consult an attorney." },
];

export default async function FundingPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
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

      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold">How to retitle each asset</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {ATTORNEY_REVIEW_REQUIRED} General guidance — confirm the exact steps
            for your state and institution.
          </p>
          <dl className="space-y-3 text-sm">
            {RETITLING_GUIDE.map((g) => (
              <div key={g.category}>
                <dt className="font-medium">{g.category}</dt>
                <dd className="text-muted-foreground">{g.how}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
