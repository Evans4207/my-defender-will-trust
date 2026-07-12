import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { STATE_NAMES } from "@/lib/interview/states";

export const metadata: Metadata = { title: "State Availability" };

type AvailabilityRow = { state_code: string; available: boolean; reason: string | null };

export default async function StatesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("state_availability")
    .select("state_code, available, reason");
  const rows = (data as AvailabilityRow[] | null) ?? [];

  const available = rows
    .filter((r) => r.available)
    .map((r) => ({ code: r.state_code, name: STATE_NAMES[r.state_code] ?? r.state_code }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const excluded = rows
    .filter((r) => !r.available)
    .map((r) => ({
      code: r.state_code,
      name: STATE_NAMES[r.state_code] ?? r.state_code,
      reason: r.reason ?? "Coming soon",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold">State availability</h1>
      <p className="mt-3 text-muted-foreground">
        We&apos;re rolling out state by state. Each state is reviewed before it
        goes live, and every document recommends review by a licensed attorney in
        your state.
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Availability is loading. Please check back shortly.
        </p>
      ) : (
        <>
          <h2 className="mt-10 font-serif text-xl font-semibold">
            Available now ({available.length})
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {available.map((s) => (
              <li
                key={s.code}
                className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium"
              >
                {s.name}
              </li>
            ))}
          </ul>

          {excluded.length > 0 && (
            <>
              <h2 className="mt-10 font-serif text-xl font-semibold">
                Not yet available
              </h2>
              <ul className="mt-4 space-y-2">
                {excluded.map((s) => (
                  <li
                    key={s.code}
                    className="flex items-center justify-between gap-4 rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="text-right text-muted-foreground">{s.reason}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      <p className="mt-8 text-sm text-muted-foreground">
        Don&apos;t see your state yet? You&apos;ll be able to join a waitlist and
        we&apos;ll email you the moment it opens.
      </p>
    </div>
  );
}
