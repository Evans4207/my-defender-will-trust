import { describe, it, expect } from "vitest";
import { assembleTrust, assemblePouroverWill } from "./trust";
import { assembleDocument } from "./assemble";
import { renderDocx, extractDocxText } from "./docx";
import { INSTRUMENTS, type Instrument, type StateRuleset } from "./state-rules";

function ruleset(p: Partial<StateRuleset> = {}): StateRuleset {
  return {
    state: "AZ",
    instrument: "will",
    hasRecordedRules: true,
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
  about: { fullName: "Jane Doe", maritalStatus: "married" },
  family: { children: [{ name: "Kid A", isMinor: true }] },
  fiduciaries: {
    executorName: "Sam Smith",
    guardianName: "Aunt May",
    trusteeName: "Jane Doe",
    successorTrusteeName: "Sam Smith",
  },
  distributions: {
    beneficiaries: [{ name: "Kid A", percent: "100" }],
    distributionType: "per_stirpes",
  },
  assets: {
    realEstate: [{ description: "123 Main St" }],
    accounts: [{ institution: "Chase" }],
  },
};

describe("assembleTrust", () => {
  it("names the trust after the grantor and lists funded assets", () => {
    const d = assembleTrust({ answers, ruleset: ruleset() });
    expect(d.title).toBe("The Jane Doe Revocable Living Trust");
    const funding = d.sections.find((s) => s.heading.includes("Funding"));
    expect(funding?.paragraphs.join(" ")).toContain("123 Main St");
    expect(funding?.paragraphs.join(" ")).toContain("Chase");
  });

  it("includes a community-property article only for community-property states", () => {
    const cp = assembleTrust({ answers, ruleset: ruleset({ communityProperty: true }) });
    const common = assembleTrust({ answers, ruleset: ruleset({ communityProperty: false }) });
    expect(cp.sections.some((s) => s.heading.includes("Community Property"))).toBe(true);
    expect(common.sections.some((s) => s.heading.includes("Community Property"))).toBe(false);
  });

  it("flags a missing successor trustee for review", () => {
    const d = assembleTrust({
      answers: { ...answers, fiduciaries: { trusteeName: "Jane Doe" } },
      ruleset: ruleset(),
    });
    const trustees = d.sections.find((s) => s.heading.includes("Trustees"));
    expect(trustees?.paragraphs.join(" ")).toContain("ATTORNEY REVIEW REQUIRED");
  });

  it("renders a valid DOCX", async () => {
    const text = await extractDocxText(await renderDocx(assembleTrust({ answers, ruleset: ruleset({ communityProperty: true }) })));
    expect(text).toContain("Revocable Living Trust");
    expect(text).toContain("community property");
  });
});

describe("assemblePouroverWill", () => {
  it("pours the estate into the grantor's trust and names a guardian for minors", () => {
    const d = assemblePouroverWill({ answers, ruleset: ruleset() });
    const pour = d.sections.find((s) => s.heading.includes("Pour-Over"));
    expect(pour?.paragraphs.join(" ")).toContain("The Jane Doe Revocable Living Trust");
    expect(d.sections.some((s) => s.heading.includes("Guardian"))).toBe(true);
  });
});

describe("assembleDocument dispatch", () => {
  const rulesets = Object.fromEntries(
    INSTRUMENTS.map((i) => [i, ruleset({ instrument: i })]),
  ) as Record<Instrument, StateRuleset>;

  it("routes each kind to the right assembler", () => {
    for (const kind of ["will", "trust", "pourover", "poa", "healthcare", "hipaa"] as const) {
      const d = assembleDocument({ kind, signer: "primary" }, { answers, rulesets });
      expect(d.kind).toBe(kind);
      expect(d.attorneyReviewRequired).toBe(true);
    }
  });

  it("hands each document the ruleset for the instrument that governs it", () => {
    // A pour-over will is a will, so it must receive the WILL ruleset even
    // though the customer bought a trust package. Everything else takes its own.
    // Distinct marker per instrument, so the document's `state` reveals which
    // ruleset it was handed. (Not derived from the name: "poa" and "pourover"
    // share a prefix.)
    const MARK: Record<Instrument, string> = {
      will: "WI",
      pourover: "PO",
      trust: "TR",
      poa: "PA",
      healthcare: "HE",
      hipaa: "HP",
    };
    const seen: Record<string, Instrument> = {};
    const spy = Object.fromEntries(
      INSTRUMENTS.map((i) => [i, ruleset({ instrument: i, state: MARK[i] })]),
    ) as Record<Instrument, StateRuleset>;

    for (const kind of ["will", "pourover", "trust", "poa", "healthcare"] as const) {
      const d = assembleDocument({ kind, signer: "primary" }, { answers, rulesets: spy });
      seen[kind] = INSTRUMENTS.find((i) => spy[i].state === d.state)!;
    }

    expect(seen.will).toBe("will");
    expect(seen.pourover).toBe("will");
    expect(seen.trust).toBe("trust");
    expect(seen.poa).toBe("poa");
    expect(seen.healthcare).toBe("healthcare");
  });
});
