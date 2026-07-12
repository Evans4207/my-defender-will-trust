import { describe, it, expect } from "vitest";
import { referralFor, ABA_REFERRAL } from "./attorney-referrals";

describe("referralFor", () => {
  it("returns the state bar referral for curated pilot states", () => {
    for (const code of ["CA", "FL", "NV", "AZ", "TX"]) {
      const r = referralFor(code);
      expect(r.national).toBe(false);
      expect(r.url).toMatch(/^https:\/\//);
    }
  });

  it("falls back to the ABA national directory for uncurated states", () => {
    const r = referralFor("WY");
    expect(r.national).toBe(true);
    expect(r.url).toBe(ABA_REFERRAL);
  });
});
