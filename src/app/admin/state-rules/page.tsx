import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STATE_NAMES } from "@/lib/interview/states";
import {
  toggleStateAvailabilityAction,
  setQaApprovedAction,
} from "@/lib/admin/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin — State rules" };

export default async function AdminStateRulesPage() {
  const supabase = await createClient();
  const [availRes, rulesRes] = await Promise.all([
    supabase.from("state_availability").select("state_code, available, qa_approved"),
    supabase.from("state_rules").select("state_code, needs_review"),
  ]);
  const avail =
    (availRes.data as { state_code: string; available: boolean; qa_approved: boolean }[] | null) ?? [];
  const rules = (rulesRes.data as { state_code: string; needs_review: boolean }[] | null) ?? [];

  const needsReview = new Map<string, number>();
  for (const r of rules) {
    if (r.needs_review) needsReview.set(r.state_code, (needsReview.get(r.state_code) ?? 0) + 1);
  }
  const sorted = [...avail].sort((a, b) =>
    (STATE_NAMES[a.state_code] ?? a.state_code).localeCompare(STATE_NAMES[b.state_code] ?? b.state_code),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">State rules</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Toggle availability and record counsel QA sign-off per state.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">State</th>
                  <th className="py-2 pr-4">Available</th>
                  <th className="py-2 pr-4">QA approved</th>
                  <th className="py-2 pr-4">Needs review</th>
                  <th className="py-2">Edit</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => (
                  <tr key={s.state_code} className="border-b">
                    <td className="py-2 pr-4 font-medium">{STATE_NAMES[s.state_code] ?? s.state_code}</td>
                    <td className="py-2 pr-4">
                      <form action={toggleStateAvailabilityAction.bind(null, s.state_code, !s.available)}>
                        <Button type="submit" size="sm" variant={s.available ? "outline" : "ghost"}>
                          {s.available ? "Available" : "Off"}
                        </Button>
                      </form>
                    </td>
                    <td className="py-2 pr-4">
                      <form action={setQaApprovedAction.bind(null, s.state_code, !s.qa_approved)}>
                        <Button type="submit" size="sm" variant={s.qa_approved ? "default" : "ghost"}>
                          {s.qa_approved ? "Approved" : "Pending"}
                        </Button>
                      </form>
                    </td>
                    <td className="py-2 pr-4">{needsReview.get(s.state_code) ?? 0}</td>
                    <td className="py-2">
                      <Link className="underline" href={`/admin/state-rules/${s.state_code}`}>
                        Edit rules
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
