import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  computeFunnel,
  computeDocsByState,
  conversionRate,
} from "@/lib/admin/metrics";
import { STATE_NAMES } from "@/lib/interview/states";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin — Metrics" };

const ACTIVE = new Set(["active", "trialing"]);

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-serif text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function AdminMetricsPage() {
  const supabase = await createClient();
  const [signupsRes, subsRes, redsRes, eventsRes, mattersRes, docsRes] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("subscriptions").select("user_id, status, plan"),
      supabase.from("code_redemptions").select("user_id"),
      supabase.from("interview_events").select("step_key, event_type, matter_id"),
      supabase.from("matters").select("id, state, status"),
      supabase.from("documents").select("matter_id"),
    ]);

  const subs = (subsRes.data as { user_id: string; status: string; plan: string }[] | null) ?? [];
  const reds = (redsRes.data as { user_id: string }[] | null) ?? [];
  const matters = (mattersRes.data as { id: string; state: string | null; status: string }[] | null) ?? [];
  const docs = (docsRes.data as { matter_id: string }[] | null) ?? [];

  const entitled = new Set<string>();
  for (const s of subs) if (ACTIVE.has(s.status) && (s.plan === "will" || s.plan === "trust")) entitled.add(s.user_id);
  for (const r of reds) entitled.add(r.user_id);

  const signups = signupsRes.count ?? 0;
  const funnel = computeFunnel(
    (eventsRes.data as { step_key: string | null; event_type: string; matter_id: string }[] | null) ?? [],
  );
  const docsByState = computeDocsByState(matters, docs);
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.completed));

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl font-semibold">Metrics</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Signups" value={signups} />
        <Stat label="Conversion" value={`${conversionRate(signups, entitled.size)}%`} />
        <Stat label="Matters started" value={matters.length} />
        <Stat label="Documents generated" value={docs.length} />
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold">Interview funnel</h2>
          <p className="text-sm text-muted-foreground">Matters completing each step.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {funnel.map((f) => (
            <div key={f.key} className="flex items-center gap-3 text-sm">
              <span className="w-32 shrink-0 text-muted-foreground">{f.title}</span>
              <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
                <div
                  className="h-full rounded bg-accent"
                  style={{ width: `${(f.completed / maxFunnel) * 100}%` }}
                />
              </div>
              <span className="w-10 text-right font-medium">{f.completed}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold">Documents by state</h2>
        </CardHeader>
        <CardContent>
          {docsByState.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents yet.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {docsByState.map((d) => (
                <li key={d.state} className="flex justify-between rounded border px-3 py-1.5">
                  <span>{STATE_NAMES[d.state] ?? d.state}</span>
                  <span className="font-medium">{d.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
