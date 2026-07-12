import type { Metadata } from "next";
import { getEntitlement } from "@/lib/entitlements.server";
import { createClient } from "@/lib/supabase/server";
import { completeCheckupAction } from "@/lib/checkup/actions";
import { MembershipUpsell } from "@/components/membership-upsell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Annual estate checkup" };

const PROMPTS = [
  "Marriage, divorce, or a new partner",
  "A birth, adoption, or new dependent",
  "A death among your beneficiaries or fiduciaries",
  "A home purchase or sale, or a big change in assets",
  "A move to a new state",
];

export default async function CheckupPage() {
  const entitlement = await getEntitlement();
  if (!entitlement.membership) {
    return <MembershipUpsell feature="The annual estate checkup" />;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("last_checkup_at, next_checkup_due")
    .maybeSingle();
  const profile = data as {
    last_checkup_at: string | null;
    next_checkup_due: string | null;
  } | null;

  const last = profile?.last_checkup_at
    ? new Date(profile.last_checkup_at).toLocaleDateString()
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Annual estate checkup</h1>
        <p className="mt-1 text-muted-foreground">
          Life changes. A quick yearly review keeps your documents current.
          {last ? ` Last completed ${last}.` : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold">Has anything changed?</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {PROMPTS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="text-sm">
            If any of these apply, reopen your interview to update and regenerate
            your documents. If nothing has changed, mark your checkup complete and
            we&apos;ll remind you again next year.
          </p>
          <form action={completeCheckupAction}>
            <Button type="submit">Mark this year&apos;s checkup complete</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
