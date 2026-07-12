import type { Metadata } from "next";

export const metadata: Metadata = { title: "State Availability" };

// Static snapshot for the Phase 0 demo. Once the hosted DB is live this page
// will read from `state_availability` (single source of truth, admin-toggled).
const AVAILABLE = [
  { code: "CA", name: "California" },
  { code: "FL", name: "Florida" },
  { code: "NV", name: "Nevada" },
  { code: "AZ", name: "Arizona" },
];

const EXCLUDED = [
  { code: "TX", name: "Texas", reason: "Pending counsel review (UPL history)" },
  { code: "LA", name: "Louisiana", reason: "Civil-law jurisdiction / forced heirship" },
  { code: "NC", name: "North Carolina", reason: "Pending counsel review (UPL history)" },
  { code: "MO", name: "Missouri", reason: "Pending counsel review (UPL history)" },
  { code: "OH", name: "Ohio", reason: "Pending counsel review (UPL history)" },
];

export default function StatesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold">State availability</h1>
      <p className="mt-3 text-muted-foreground">
        We&apos;re rolling out state by state. Each state goes live only after a
        per-state legal QA sign-off.
      </p>

      <h2 className="mt-10 font-serif text-xl font-semibold">Available now</h2>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {AVAILABLE.map((s) => (
          <li
            key={s.code}
            className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium"
          >
            {s.name}
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-serif text-xl font-semibold">
        Not yet available
      </h2>
      <ul className="mt-4 space-y-2">
        {EXCLUDED.map((s) => (
          <li
            key={s.code}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <span className="font-medium">{s.name}</span>
            <span className="text-muted-foreground">{s.reason}</span>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-muted-foreground">
        Don&apos;t see your state? You&apos;ll be able to join a waitlist and
        we&apos;ll email you the moment it opens.
      </p>
    </div>
  );
}
