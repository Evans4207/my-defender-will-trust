import { WILL_STEPS } from "@/lib/interview/steps";

export type FunnelRow = { key: string; title: string; completed: number };

/** Distinct matters that COMPLETED each interview step (the completion funnel). */
export function computeFunnel(
  events: { step_key: string | null; event_type: string; matter_id: string }[],
): FunnelRow[] {
  const byStep = new Map<string, Set<string>>();
  for (const e of events) {
    if (e.event_type === "step_completed" && e.step_key) {
      if (!byStep.has(e.step_key)) byStep.set(e.step_key, new Set());
      byStep.get(e.step_key)!.add(e.matter_id);
    }
  }
  return WILL_STEPS.map((s) => ({
    key: s.key,
    title: s.title,
    completed: byStep.get(s.key)?.size ?? 0,
  }));
}

/** Count of generated documents grouped by state, sorted desc. */
export function computeDocsByState(
  matters: { id: string; state: string | null }[],
  documents: { matter_id: string }[],
): { state: string; count: number }[] {
  const stateByMatter = new Map(matters.map((m) => [m.id, m.state ?? "—"]));
  const counts = new Map<string, number>();
  for (const d of documents) {
    const st = stateByMatter.get(d.matter_id) ?? "—";
    counts.set(st, (counts.get(st) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count);
}

/** Conversion rate as a 0–100 percentage. */
export function conversionRate(signups: number, entitled: number): number {
  if (signups <= 0) return 0;
  return Math.round((entitled / signups) * 100);
}
