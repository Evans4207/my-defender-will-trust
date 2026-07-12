import { describe, it, expect } from "vitest";
import { computeFunnel, computeDocsByState, conversionRate } from "./metrics";

describe("computeFunnel", () => {
  it("counts distinct matters that completed each step", () => {
    const rows = computeFunnel([
      { step_key: "state", event_type: "step_completed", matter_id: "m1" },
      { step_key: "state", event_type: "step_completed", matter_id: "m1" }, // dup
      { step_key: "state", event_type: "step_completed", matter_id: "m2" },
      { step_key: "about", event_type: "step_completed", matter_id: "m1" },
      { step_key: "state", event_type: "step_viewed", matter_id: "m3" }, // not completed
    ]);
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r.completed]));
    expect(byKey.state).toBe(2);
    expect(byKey.about).toBe(1);
    expect(byKey.review).toBe(0);
  });
});

describe("computeDocsByState", () => {
  it("groups document counts by matter state, sorted desc", () => {
    const result = computeDocsByState(
      [
        { id: "m1", state: "CA" },
        { id: "m2", state: "FL" },
        { id: "m3", state: "CA" },
      ],
      [{ matter_id: "m1" }, { matter_id: "m3" }, { matter_id: "m2" }],
    );
    expect(result[0]).toEqual({ state: "CA", count: 2 });
    expect(result[1]).toEqual({ state: "FL", count: 1 });
  });
});

describe("conversionRate", () => {
  it("computes a rounded percentage", () => {
    expect(conversionRate(200, 50)).toBe(25);
    expect(conversionRate(0, 0)).toBe(0);
    expect(conversionRate(3, 1)).toBe(33);
  });
});
