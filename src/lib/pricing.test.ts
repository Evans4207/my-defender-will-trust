import { describe, it, expect } from "vitest";
import {
  applyDiscountCents,
  listPriceCents,
  formatUsd,
  LAUNCH_PRICES,
  DEFAULT_DISCOUNT_PCT,
} from "./pricing";

describe("launch prices", () => {
  it("matches owner-approved list prices (§3.2)", () => {
    expect(LAUNCH_PRICES.will.individual).toBe(15900);
    expect(LAUNCH_PRICES.will.couples).toBe(24900);
    expect(LAUNCH_PRICES.trust.individual).toBe(44900);
    expect(LAUNCH_PRICES.trust.couples).toBe(57900);
    expect(LAUNCH_PRICES.membership.annual).toBe(4900);
  });

  it("listPriceCents returns the right cell", () => {
    expect(listPriceCents("will", "individual")).toBe(15900);
    expect(listPriceCents("trust", "couples")).toBe(57900);
  });
});

describe("applyDiscountCents", () => {
  it("reproduces the owner-stated 50%-off launch math ($79 will / $224 trust)", () => {
    expect(applyDiscountCents(15900, DEFAULT_DISCOUNT_PCT)).toBe(7900);
    expect(applyDiscountCents(44900, DEFAULT_DISCOUNT_PCT)).toBe(22400);
  });

  it("floors to whole dollars", () => {
    // 24900 * 0.5 = 12450 -> $124.50 -> $124
    expect(applyDiscountCents(24900, 50)).toBe(12400);
  });

  it("handles edge percentages", () => {
    expect(applyDiscountCents(15900, 0)).toBe(15900);
    expect(applyDiscountCents(15900, 100)).toBe(0);
  });
});

describe("formatUsd", () => {
  it("shows whole dollars without cents", () => {
    expect(formatUsd(15900)).toBe("$159");
    expect(formatUsd(4900)).toBe("$49");
  });
});
