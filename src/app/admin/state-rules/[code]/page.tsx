import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STATE_NAMES } from "@/lib/interview/states";
import { updateStateRuleAction } from "@/lib/admin/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin — Edit state rules" };

type Rule = {
  id: string;
  rule_key: string;
  /** public.instrument_type — which instrument the rule governs. NULL = a fact
   *  about the state itself (community property), NOT "applies to all". */
  instrument: string | null;
  rule_value: unknown;
  citation: string | null;
  effective_date: string | null;
  needs_review: boolean;
};

export default async function EditStateRulesPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("state_rules")
    .select("id, rule_key, instrument, rule_value, citation, effective_date, needs_review")
    .eq("state_code", code)
    .order("rule_key");
  const rules = (data as Rule[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">
          {STATE_NAMES[code] ?? code} — rules
        </h1>
        <Link className="text-sm underline" href="/admin/state-rules">
          Back
        </Link>
      </div>

      <div className="space-y-4">
        {rules.map((r) => (
          <Card key={r.id}>
            <CardContent className="pt-6">
              <form action={updateStateRuleAction.bind(null, r.id)} className="space-y-3">
                <input type="hidden" name="state_code" value={code} />
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm font-medium">
                    {r.rule_key}
                    {r.instrument ? ` (${r.instrument})` : " (state-level)"}
                  </p>
                  <code className="rounded bg-muted px-2 py-1 text-xs">
                    {JSON.stringify(r.rule_value)}
                  </code>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`cite-${r.id}`}>Citation</Label>
                    <Input id={`cite-${r.id}`} name="citation" defaultValue={r.citation ?? ""} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`eff-${r.id}`}>Effective date</Label>
                    <Input id={`eff-${r.id}`} name="effective_date" type="date" defaultValue={r.effective_date ?? ""} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="needs_review" defaultChecked={r.needs_review} className="size-4" />
                    Needs review
                  </label>
                  <Button type="submit" size="sm">Save</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
