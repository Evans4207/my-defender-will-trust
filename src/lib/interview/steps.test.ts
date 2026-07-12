import { describe, it, expect } from "vitest";
import {
  WILL_STEPS,
  nextStepKey,
  prevStepKey,
  stepIndex,
  isStepKey,
  minutesRemaining,
} from "./steps";

describe("interview step registry", () => {
  it("starts at state and ends at review", () => {
    expect(WILL_STEPS[0].key).toBe("state");
    expect(WILL_STEPS[WILL_STEPS.length - 1].key).toBe("review");
  });

  it("navigates forward and backward", () => {
    expect(nextStepKey("state")).toBe("doctype");
    expect(prevStepKey("doctype")).toBe("state");
    expect(nextStepKey("review")).toBe(null);
    expect(prevStepKey("state")).toBe(null);
  });

  it("indexes steps", () => {
    expect(stepIndex("state")).toBe(0);
    expect(stepIndex("review")).toBe(WILL_STEPS.length - 1);
  });

  it("recognizes valid step keys", () => {
    expect(isStepKey("about")).toBe(true);
    expect(isStepKey("generate")).toBe(false);
    expect(isStepKey("nope")).toBe(false);
  });

  it("counts minutes remaining monotonically decreasing", () => {
    const atStart = minutesRemaining("state");
    const atReview = minutesRemaining("review");
    expect(atStart).toBeGreaterThan(atReview);
    expect(atReview).toBe(WILL_STEPS[WILL_STEPS.length - 1].estMinutes);
  });
});
