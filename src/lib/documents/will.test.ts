import { describe, it, expect } from "vitest";
import { assembleWill } from "./will";
import { renderDocx, extractDocxText } from "./docx";
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

const answers = {
  about: { fullName: "Jane Doe", maritalStatus: "married", state: "TX" },
  family: {
    spouseName: "John Doe",
    children: [
      { name: "Kid A", isMinor: true },
      { name: "Kid B", isMinor: false },
    ],
  },
  fiduciaries: { executorName: "Sam Smith", guardianName: "Aunt May" },
  distributions: {
    beneficiaries: [
      { name: "Kid A", percent: "50" },
      { name: "Kid B", percent: "50" },
    ],
    distributionType: "per_stirpes",
  },
  special: { digitalAssets: true },
  ancillary: { financialPoaAgent: "Sam Smith" },
};

const headings = (secs: { heading: string }[]) => secs.map((s) => s.heading);

describe("assembleWill — conditional clauses", () => {
  it("includes a community-property article only for community-property states", () => {
    const cp = assembleWill({ answers, ruleset: ruleset({ communityProperty: true }) });
    const common = assembleWill({ answers, ruleset: ruleset({ communityProperty: false }) });
    expect(headings(cp.sections).some((h) => h.includes("Community Property"))).toBe(true);
    expect(headings(common.sections).some((h) => h.includes("Community Property"))).toBe(false);
  });

  it("includes a guardian article only when there are minor children", () => {
    const withMinor = assembleWill({ answers, ruleset: ruleset() });
    const noMinor = assembleWill({
      answers: { ...answers, family: { children: [{ name: "Adult", isMinor: false }] } },
      ruleset: ruleset(),
    });
    expect(headings(withMinor.sections).some((h) => h.includes("Guardian"))).toBe(true);
    expect(headings(noMinor.sections).some((h) => h.includes("Guardian"))).toBe(false);
  });

  // These two cover the GENERIC fallback, which is used only by states that have
  // no verbatim statutory form of their own. They must therefore name such a
  // state: California prescribes no form (Cal. Prob. Code § 8220 provides for
  // proof by affidavit without prescribing its wording), so it stays on the
  // fallback permanently. Previously these used the TX fixture and passed only
  // because Texas had not been researched yet — once § 251.1045 was captured, its
  // verbatim form correctly took precedence and these silently stopped testing
  // the fallback at all.
  it("renders the notarized self-proving affidavit when required", () => {
    const d = assembleWill({
      answers,
      ruleset: ruleset({ state: "CA", selfProvingAffidavit: { available: true, requiresNotary: true } }),
    });
    const sp = d.sections.find((s) => s.heading.includes("Self-Proving"));
    expect(sp?.paragraphs.join(" ")).toContain("notary");
  });

  it("renders the unsworn declaration when notary is not required", () => {
    const d = assembleWill({
      answers,
      ruleset: ruleset({ state: "CA", selfProvingAffidavit: { available: true, requiresNotary: false } }),
    });
    const sp = d.sections.find((s) => s.heading.includes("Self-Proving"));
    expect(sp?.paragraphs.join(" ")).toContain("penalty of perjury");
  });

  it("prefers a state's own verbatim statutory form over the generic fallback", () => {
    const d = assembleWill({ answers, ruleset: ruleset({ state: "TX" }) });
    const sp = d.sections.find((s) => s.heading.includes("Self-Proving"));
    // § 251.1045's own opening words, which the generic fallback never produces.
    expect(sp?.paragraphs.join(" ")).toContain("as testator, after being duly sworn");
  });

  it("scales the number of witness signature lines with the ruleset", () => {
    const d = assembleWill({ answers, ruleset: ruleset({ witnessesRequired: 3 }) });
    const witnessLines = d.signatureLines.filter((l) => l.startsWith("Witness"));
    expect(witnessLines).toHaveLength(3);
  });
});

describe("renderDocx — produces a valid DOCX with the right content", () => {
  it("Texas: two witnesses, community property, notarized self-proof", async () => {
    const doc = assembleWill({
      answers,
      ruleset: ruleset({ state: "TX", communityProperty: true, selfProvingAffidavit: { available: true, requiresNotary: true } }),
    });
    const text = await extractDocxText(await renderDocx(doc));
    expect(text).toContain("Last Will and Testament of Jane Doe");
    expect(text).toContain("two (2) witnesses");
    expect(text).toContain("community property");
    expect(text).toContain("ATTORNEY REVIEW REQUIRED");
  });

  it("Florida: signature at the end, not community property", async () => {
    const doc = assembleWill({
      answers,
      ruleset: ruleset({ state: "FL", signatureAtEndRequired: true, communityProperty: false }),
    });
    const text = await extractDocxText(await renderDocx(doc));
    expect(text).toContain("at the end");
    expect(text).not.toContain("community property state");
  });
});
