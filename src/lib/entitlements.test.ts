import { describe, it, expect } from "vitest";
import { computeEntitlement } from "./entitlements";

describe("computeEntitlement", () => {
  it("unlocks a will package from an active subscription", () => {
    const e = computeEntitlement({
      subscriptions: [{ status: "active", plan: "will" }],
      redemptions: [],
    });
    expect(e).toEqual({
      unlocked: true,
      packages: ["will"],
      membership: false,
      source: "subscription",
    });
  });

  it("unlocks a trust package from a code redemption", () => {
    const e = computeEntitlement({
      subscriptions: [],
      redemptions: [{ package: "trust" }],
    });
    expect(e.unlocked).toBe(true);
    expect(e.packages).toEqual(["trust"]);
    expect(e.source).toBe("code");
  });

  it("treats membership-only as not unlocking a document package", () => {
    const e = computeEntitlement({
      subscriptions: [{ status: "active", plan: "membership" }],
      redemptions: [],
    });
    expect(e.unlocked).toBe(false);
    expect(e.packages).toEqual([]);
    expect(e.membership).toBe(true);
    expect(e.source).toBe(null);
  });

  it("ignores canceled/past_due subscriptions", () => {
    const e = computeEntitlement({
      subscriptions: [
        { status: "canceled", plan: "will" },
        { status: "past_due", plan: "trust" },
      ],
      redemptions: [],
    });
    expect(e.unlocked).toBe(false);
  });

  it("merges packages and prefers subscription as source", () => {
    const e = computeEntitlement({
      subscriptions: [
        { status: "active", plan: "will" },
        { status: "active", plan: "membership" },
      ],
      redemptions: [{ package: "trust" }],
    });
    expect(e.packages.sort()).toEqual(["trust", "will"]);
    expect(e.membership).toBe(true);
    expect(e.source).toBe("subscription");
  });

  it("dedupes duplicate packages", () => {
    const e = computeEntitlement({
      subscriptions: [{ status: "active", plan: "will" }],
      redemptions: [{ package: "will" }],
    });
    expect(e.packages).toEqual(["will"]);
  });

  it("returns locked for no entitlements", () => {
    expect(computeEntitlement({ subscriptions: [], redemptions: [] })).toEqual({
      unlocked: false,
      packages: [],
      membership: false,
      source: null,
    });
  });
});
