import { describe, it, expect } from "vitest";
import {
  computeEntitlement,
  MEMBERSHIP_GRACE_DAYS,
  type GrantRow,
} from "./entitlements";

const NOW = new Date("2026-07-01T00:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function iso(offsetDays: number): string {
  return new Date(NOW.getTime() + offsetDays * DAY).toISOString();
}

function grant(over: Partial<GrantRow>): GrantRow {
  return {
    product: "will",
    source: "purchase",
    granted_at: iso(-10),
    expires_at: null,
    revoked_at: null,
    ...over,
  };
}

describe("computeEntitlement", () => {
  it("unlocks a will package from a permanent purchase grant", () => {
    const e = computeEntitlement({ grants: [grant({})], now: NOW });
    expect(e.unlocked).toBe(true);
    expect(e.packages).toEqual(["will"]);
    expect(e.owned).toEqual(["will"]);
    expect(e.source).toBe("subscription");
    expect(e.membership).toBe(false);
  });

  it("unlocks a trust package from a code grant", () => {
    const e = computeEntitlement({
      grants: [grant({ product: "trust", source: "code" })],
      now: NOW,
    });
    expect(e.packages).toEqual(["trust"]);
    expect(e.source).toBe("code");
  });

  it("reports purchase as the source when both a purchase and a code exist", () => {
    const e = computeEntitlement({
      grants: [
        grant({ product: "trust", source: "code" }),
        grant({ product: "will", source: "purchase" }),
      ],
      now: NOW,
    });
    expect(e.source).toBe("subscription");
    expect(e.packages.sort()).toEqual(["trust", "will"]);
  });

  it("treats membership-only as not unlocking a document package", () => {
    const e = computeEntitlement({
      grants: [grant({ product: "membership", expires_at: iso(30) })],
      now: NOW,
    });
    expect(e.unlocked).toBe(false);
    expect(e.packages).toEqual([]);
    expect(e.membership).toBe(true);
    expect(e.source).toBe(null);
  });

  // The defect this table exists to fix: a one-time purchase must survive
  // anything that happens to the customer's subscription state.
  it("keeps a one-time purchase permanently, with no expiry to lapse", () => {
    const g = grant({ expires_at: null });
    const soon = computeEntitlement({ grants: [g], now: NOW });
    const decadeLater = computeEntitlement({
      grants: [g],
      now: new Date(NOW.getTime() + 3650 * DAY),
    });
    expect(soon.owned).toEqual(["will"]);
    expect(decadeLater.owned).toEqual(["will"]);
    expect(decadeLater.unlocked).toBe(true);
  });

  it("removes access only on explicit revocation", () => {
    const e = computeEntitlement({
      grants: [grant({ revoked_at: iso(-1) })],
      now: NOW,
    });
    expect(e.unlocked).toBe(false);
    expect(e.packages).toEqual([]);
    expect(e.owned).toEqual([]);
  });

  it("ignores an expired membership grant", () => {
    const e = computeEntitlement({
      grants: [grant({ product: "membership", expires_at: iso(-1) })],
      now: NOW,
    });
    expect(e.membership).toBe(false);
    expect(e.membershipEver).toBe(true);
  });

  it("puts a just-lapsed membership inside the grace window", () => {
    const e = computeEntitlement({
      grants: [grant({ product: "membership", expires_at: iso(-1) })],
      now: NOW,
    });
    expect(e.membershipGrace).toBe(true);
  });

  it("ends the grace window after the configured number of days", () => {
    const e = computeEntitlement({
      grants: [
        grant({
          product: "membership",
          expires_at: iso(-(MEMBERSHIP_GRACE_DAYS + 1)),
        }),
      ],
      now: NOW,
    });
    expect(e.membershipGrace).toBe(false);
    expect(e.membershipEver).toBe(true);
  });

  it("takes the latest expiry when several membership grants exist", () => {
    const e = computeEntitlement({
      grants: [
        grant({ product: "membership", expires_at: iso(-400) }),
        grant({ product: "membership", expires_at: iso(-2) }),
      ],
      now: NOW,
    });
    expect(e.membershipGrace).toBe(true);
  });

  it("does not report grace while the membership is still active", () => {
    const e = computeEntitlement({
      grants: [grant({ product: "membership", expires_at: iso(10) })],
      now: NOW,
    });
    expect(e.membership).toBe(true);
    expect(e.membershipGrace).toBe(false);
  });

  it("returns an empty entitlement for no grants", () => {
    const e = computeEntitlement({ grants: [], now: NOW });
    expect(e).toEqual({
      unlocked: false,
      packages: [],
      owned: [],
      membership: false,
      membershipEver: false,
      membershipGrace: false,
      source: null,
    });
  });

  it("ignores unknown product values", () => {
    const e = computeEntitlement({
      grants: [grant({ product: "pet_trust" }), grant({ product: null })],
      now: NOW,
    });
    expect(e.packages).toEqual([]);
    expect(e.owned).toEqual([]);
  });

  it("counts a time-limited manual grant as buildable but not owned", () => {
    const e = computeEntitlement({
      grants: [grant({ source: "manual", expires_at: iso(7) })],
      now: NOW,
    });
    expect(e.packages).toEqual(["will"]);
    expect(e.owned).toEqual([]);
  });
});
