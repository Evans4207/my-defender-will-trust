/**
 * Will-flow interview step registry (build plan §3.3). The order here defines
 * navigation and the progress bar. Trust-specific steps are added in Phase 5.
 * The rules layer stays data-driven — no state-specific branching here.
 */

export const STEP_KEYS = [
  "state",
  "doctype",
  "about",
  "family",
  "fiduciaries",
  "assets",
  "distributions",
  "special",
  "ancillary",
  "review",
] as const;

export type StepKey = (typeof STEP_KEYS)[number];

export type StepDef = {
  key: StepKey;
  title: string;
  shortTitle: string;
  estMinutes: number;
};

export const WILL_STEPS: StepDef[] = [
  { key: "state", title: "Your state", shortTitle: "State", estMinutes: 1 },
  { key: "doctype", title: "Your document", shortTitle: "Document", estMinutes: 1 },
  { key: "about", title: "About you", shortTitle: "About you", estMinutes: 3 },
  { key: "family", title: "Your family", shortTitle: "Family", estMinutes: 4 },
  { key: "fiduciaries", title: "People you trust", shortTitle: "Fiduciaries", estMinutes: 3 },
  { key: "assets", title: "Your assets", shortTitle: "Assets", estMinutes: 4 },
  { key: "distributions", title: "Who inherits", shortTitle: "Distributions", estMinutes: 4 },
  { key: "special", title: "Special provisions", shortTitle: "Special", estMinutes: 3 },
  { key: "ancillary", title: "Ancillary documents", shortTitle: "Ancillary", estMinutes: 3 },
  { key: "review", title: "Review & finish", shortTitle: "Review", estMinutes: 2 },
];

export function isStepKey(value: string): value is StepKey {
  return (STEP_KEYS as readonly string[]).includes(value);
}

export function stepIndex(key: StepKey): number {
  return WILL_STEPS.findIndex((s) => s.key === key);
}

export function stepDef(key: StepKey): StepDef {
  return WILL_STEPS[stepIndex(key)];
}

export function nextStepKey(key: StepKey): StepKey | null {
  const i = stepIndex(key);
  return i >= 0 && i < WILL_STEPS.length - 1 ? WILL_STEPS[i + 1].key : null;
}

export function prevStepKey(key: StepKey): StepKey | null {
  const i = stepIndex(key);
  return i > 0 ? WILL_STEPS[i - 1].key : null;
}

/** Minutes of interview remaining from (and including) the given step. */
export function minutesRemaining(key: StepKey): number {
  const i = stepIndex(key);
  return WILL_STEPS.slice(i).reduce((sum, s) => sum + s.estMinutes, 0);
}
