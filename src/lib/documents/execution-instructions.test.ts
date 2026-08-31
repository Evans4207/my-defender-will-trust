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

describe("electronic-will note", () => {
  // Regression guard for the one seeded rule key that had no consumer anywhere
  // in the product: `electronic_will_permitted` was parsed into the ruleset by
  // state-rules.ts and then read by nothing.
  it("tells the customer the document is paper where the state permits e-wills", () => {
    const i = buildExecutionInstructions(ruleset({ state: "ID", electronicWillPermitted: true }));
    const text = i.steps.join(" ");
    expect(text).toContain("permits electronic wills by statute");
    expect(text).toContain("is not an electronic will");
    expect(i.electronicWillPermitted).toBe(true);
  });

  it("says nothing about electronic wills where the state does not permit them", () => {
    const i = buildExecutionInstructions(ruleset({ electronicWillPermitted: false }));
    expect(i.steps.join(" ").toLowerCase()).not.toContain("electronic will");
    expect(i.electronicWillPermitted).toBe(false);
  });

  it("never withdraws the print-and-sign instruction in an e-will state", () => {
    // The note explains the wet-signature position; it must not replace it.
    const i = buildExecutionInstructions(ruleset({ electronicWillPermitted: true }));
    expect(i.steps[0]).toContain("Print the complete document");
    expect(i.checklist).toContain("All pages printed and in order");
  });
});
