import { describe, it, expect } from "vitest";
import { assembleWill } from "./will";
import { assembleTrust, assemblePouroverWill } from "./trust";
import { assemblePoa } from "./ancillary";
import { documentSpecsFor } from "./package";
import type { StateRuleset } from "./state-rules";

function ruleset(p: Partial<StateRuleset> = {}): StateRuleset {
  return {
    state: "TX",
    instrument: "will",
    hasRecordedRules: true,
    recordedRuleKeys: ["witnesses_required", "notarization_required_for_document"],
    executionAlternatives: null,
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
  about: { fullName: "Jane Doe", maritalStatus: "married", state: "TX", party: "couples" },
  family: { spouseName: "John Doe", children: [] as unknown[] },
  fiduciaries: { executorName: "Sam Smith", successorTrusteeName: "Trusty Bank" },
  distributions: {
    beneficiaries: [{ name: "Kid A", percent: "100" }],
    distributionType: "per_stirpes",
  },
  special: {},
  ancillary: { financialPoaAgent: "Sam Smith", healthcareAgent: "Dr. Care" },
};

const allText = (d: { sections: { paragraphs: string[] }[] }) =>
  d.sections.flatMap((s) => s.paragraphs).join(" ");

describe("documentSpecsFor — couples produce a set per spouse", () => {
  it("individual will = one set of 4", () => {
    const specs = documentSpecsFor("will", "individual");
    expect(specs).toHaveLength(4);
    expect(specs.every((s) => s.signer === "primary")).toBe(true);
  });

  it("couples will = two sets (8), one will per spouse", () => {
    const specs = documentSpecsFor("will", "couples");
    expect(specs).toHaveLength(8);
    expect(specs.filter((s) => s.kind === "will")).toHaveLength(2);
    expect(specs.some((s) => s.kind === "will" && s.signer === "spouse")).toBe(true);
  });

  it("couples trust = one joint trust + two pour-over wills", () => {
    const specs = documentSpecsFor("trust", "couples");
    expect(specs.filter((s) => s.kind === "trust")).toEqual([{ kind: "trust", signer: "joint" }]);
    expect(specs.filter((s) => s.kind === "pourover")).toHaveLength(2);
  });
});

describe("mirror wills — each leaves to the other spouse", () => {
  it("primary's will leaves to the spouse and names them executor", () => {
    const d = assembleWill({ answers, ruleset: ruleset(), party: "couples", signer: "primary" });
    expect(d.title).toBe("Last Will and Testament of Jane Doe");
    const text = allText(d);
    expect(text).toContain("residuary estate to my spouse, John Doe");
    expect(text).toContain("I appoint my spouse, John Doe, as the Executor");
    expect(text).toContain("ATTORNEY REVIEW REQUIRED");
  });

  it("spouse's will mirrors it (leaves to the primary)", () => {
    const d = assembleWill({ answers, ruleset: ruleset(), party: "couples", signer: "spouse" });
    expect(d.title).toBe("Last Will and Testament of John Doe");
    const text = allText(d);
    expect(text).toContain("residuary estate to my spouse, Jane Doe");
    expect(text).toContain("ATTORNEY REVIEW REQUIRED");
  });
});

describe("reciprocal directives — each names the other as agent", () => {
  it("primary's POA appoints the spouse as agent", () => {
    const d = assemblePoa({ answers, ruleset: ruleset(), party: "couples", signer: "primary" });
    expect(d.signerName).toBe("Jane Doe");
    expect(allText(d)).toContain("appoint John Doe as my agent");
  });
});

describe("joint trust — names both grantors", () => {
  it("titles and establishes the trust for both spouses", () => {
    const d = assembleTrust({ answers, ruleset: ruleset(), party: "couples", signer: "joint" });
    expect(d.title).toBe("The Jane Doe and John Doe Joint Revocable Living Trust");
    expect(allText(d)).toContain("We, Jane Doe and John Doe");
    expect(d.signatureLines).toContain("Grantor: Jane Doe");
    expect(d.signatureLines).toContain("Grantor: John Doe");
  });

  it("each pour-over will feeds the one joint trust", () => {
    const d = assemblePouroverWill({ answers, ruleset: ruleset(), party: "couples", signer: "spouse" });
    expect(d.title).toBe("Pour-Over Will of John Doe");
    expect(allText(d)).toContain("The Jane Doe and John Doe Joint Revocable Living Trust");
  });
});
