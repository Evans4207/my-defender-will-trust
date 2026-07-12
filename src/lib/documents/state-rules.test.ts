import { describe, it, expect } from "vitest";
import { normalizeStateRules } from "./state-rules";

describe("normalizeStateRules", () => {
  it("parses Texas rules (2 witnesses, notarized self-proof, community property)", () => {
    const r = normalizeStateRules("TX", [
      { rule_key: "witnesses_required", rule_value: { count: 2 }, needs_review: false },
      { rule_key: "witness_min_age", rule_value: { age: 14 }, needs_review: false },
      { rule_key: "self_proving_affidavit", rule_value: { available: true, requires_notary: true } },
      { rule_key: "community_property", rule_value: { community_property: true } },
    ]);
    expect(r.witnessesRequired).toBe(2);
    expect(r.witnessMinAge).toBe(14);
    expect(r.selfProvingAffidavit).toEqual({ available: true, requiresNotary: true });
    expect(r.communityProperty).toBe(true);
  });

  it("flags California's uncertain self-proving affidavit for review", () => {
    const r = normalizeStateRules("CA", [
      { rule_key: "self_proving_affidavit", rule_value: { available: "uncertain" }, needs_review: true },
      { rule_key: "community_property", rule_value: { community_property: true } },
    ]);
    expect(r.selfProvingAffidavit.available).toBe("uncertain");
    expect(r.needsReview).toBe(true);
  });

  it("parses Nevada's unsworn-declaration self-proof (no notary)", () => {
    const r = normalizeStateRules("NV", [
      { rule_key: "self_proving_affidavit", rule_value: { available: true, requires_notary: false } },
    ]);
    expect(r.selfProvingAffidavit).toEqual({ available: true, requiresNotary: false });
  });

  it("parses Florida (signature at end, not community property)", () => {
    const r = normalizeStateRules("FL", [
      { rule_key: "signature_at_end_required", rule_value: { required: true } },
      { rule_key: "community_property", rule_value: { community_property: false } },
    ]);
    expect(r.signatureAtEndRequired).toBe(true);
    expect(r.communityProperty).toBe(false);
  });

  it("defaults to 2 witnesses when unspecified", () => {
    expect(normalizeStateRules("XX", []).witnessesRequired).toBe(2);
  });
});
