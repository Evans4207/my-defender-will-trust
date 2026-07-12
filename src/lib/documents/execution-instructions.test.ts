import { describe, it, expect } from "vitest";
import { buildExecutionInstructions } from "./execution-instructions";
import type { StateRuleset } from "./state-rules";

function ruleset(p: Partial<StateRuleset> = {}): StateRuleset {
  return {
    state: "TX",
    witnessesRequired: 2,
    witnessMinAge: null,
    notarizationRequired: false,
    selfProvingAffidavit: { available: true, requiresNotary: true },
    communityProperty: false,
    signatureAtEndRequired: false,
    electronicWillPermitted: false,
    needsReview: false,
    citations: {},
    ...p,
  };
}

describe("buildExecutionInstructions", () => {
  it("states the witness count and notary self-proof step", () => {
    const i = buildExecutionInstructions(ruleset({ witnessesRequired: 2 }));
    expect(i.steps.join(" ")).toContain("2 competent witnesses");
    expect(i.steps.join(" ").toLowerCase()).toContain("notary");
    expect(i.checklist.join(" ")).toContain("2 witness signatures");
  });

  it("uses the unsworn declaration step when notary is not required", () => {
    const i = buildExecutionInstructions(ruleset({ selfProvingAffidavit: { available: true, requiresNotary: false } }));
    expect(i.steps.join(" ").toLowerCase()).toContain("unsworn declaration");
  });

  it("adds a sign-at-the-end step when the state requires it", () => {
    const i = buildExecutionInstructions(ruleset({ signatureAtEndRequired: true }));
    expect(i.steps.join(" ")).toContain("END");
  });

  it("adds a notarize-the-will step when the state requires notarization", () => {
    const i = buildExecutionInstructions(ruleset({ notarizationRequired: true }));
    expect(i.steps.join(" ").toLowerCase()).toContain("requires notarization");
  });
});
