import { describe, it, expect } from "vitest";
import { COUPLES_TIER_OPEN } from "./features";
import { assertPartyAvailable } from "./stripe/config";

/**
 * These assertions are deliberately tied to the flag rather than hardcoded, so
 * that reopening the couples tier flips the expectations in one place instead of
 * leaving a red suite for someone else to interpret.
 */
describe("couples tier gate", () => {
  it("is currently closed", () => {
    expect(COUPLES_TIER_OPEN).toBe(false);
  });

  it("always allows the individual party", () => {
    expect(assertPartyAvailable("individual")).toBe("individual");
  });

  it("rejects a crafted couples POST while the tier is closed", () => {
    if (COUPLES_TIER_OPEN) {
      expect(assertPartyAvailable("couples")).toBe("couples");
    } else {
      expect(() => assertPartyAvailable("couples")).toThrow(/not available yet/);
    }
  });

  it("rejects any other value", () => {
    expect(() => assertPartyAvailable("family")).toThrow(/Unknown package type/);
  });
});
