import { describe, it, expect } from "vitest";
import { validateStep } from "./schema";

describe("validateStep", () => {
  it("requires a valid state", () => {
    expect(validateStep("state", { state: "CA" }).ok).toBe(true);
    expect(validateStep("state", { state: "ZZ" }).ok).toBe(false);
    expect(validateStep("state", {}).ok).toBe(false);
  });

  it("requires core about fields", () => {
    const ok = validateStep("about", {
      fullName: "Jane Doe",
      dob: "1970-01-01",
      address1: "1 Main St",
      city: "Phoenix",
      state: "AZ",
      zip: "85001",
      maritalStatus: "married",
    });
    expect(ok.ok).toBe(true);
    expect(validateStep("about", { fullName: "" }).ok).toBe(false);
  });

  it("requires beneficiary shares to total 100%", () => {
    const bad = validateStep("distributions", {
      beneficiaries: [
        { name: "A", percent: "60" },
        { name: "B", percent: "30" },
      ],
      distributionType: "per_stirpes",
    });
    expect(bad.ok).toBe(false);

    const good = validateStep("distributions", {
      beneficiaries: [
        { name: "A", percent: "60" },
        { name: "B", percent: "40" },
      ],
      distributionType: "per_stirpes",
    });
    expect(good.ok).toBe(true);
  });

  it("requires at least one beneficiary", () => {
    expect(
      validateStep("distributions", {
        beneficiaries: [],
        distributionType: "per_capita",
      }).ok,
    ).toBe(false);
  });

  it("requires an executor", () => {
    expect(validateStep("fiduciaries", { executorName: "Sam" }).ok).toBe(true);
    expect(validateStep("fiduciaries", { executorName: "" }).ok).toBe(false);
  });

  it("accepts an empty review step", () => {
    expect(validateStep("review", {}).ok).toBe(true);
  });
});
