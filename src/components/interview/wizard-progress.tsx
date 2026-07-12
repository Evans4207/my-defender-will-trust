import {
  WILL_STEPS,
  stepIndex,
  minutesRemaining,
  type StepKey,
} from "@/lib/interview/steps";

export function WizardProgress({ stepKey }: { stepKey: StepKey }) {
  const idx = stepIndex(stepKey);
  const total = WILL_STEPS.length;
  const pct = Math.round((idx / (total - 1)) * 100);
  const mins = minutesRemaining(stepKey);

  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">
          Step {idx + 1} of {total}: {WILL_STEPS[idx].title}
        </span>
        <span className="text-muted-foreground">About {mins} min left</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
