import { describe, it, expect } from "vitest";
import { assembleWill } from "./will";
import { assembleTrust, assemblePouroverWill } from "./trust";
import { assemblePoa, assembleHealthcare, assembleHipaa } from "./ancillary";
import {
  PENDING_EXECUTION_BLOCK_LINE,
  hasRecordedExecutionRules,
  testamentarySignatureLines,
} from "./execution-block";
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
  family: { spouseName: "John Doe", children: [{ name: "Kid A", isMinor: true }] },
  fiduciaries: { executorName: "Sam Smith", successorTrusteeName: "Sam Smith" },
  distributions: { beneficiaries: [{ name: "Kid A", percent: "100" }] },
  ancillary: { financialPoaAgent: "Sam Smith", healthcareAgent: "Sam Smith" },
};

// The pending-review marker mentions the word "notary", so it has to be excluded
// or it counts as a notary line and every fail-closed assertion passes falsely.
const notaryLines = (lines: string[]) =>
  lines.filter(
    (l) => l !== PENDING_EXECUTION_BLOCK_LINE && /notar/i.test(l),
  );
const witnessLines = (lines: string[]) =>
  lines.filter((l) => l.startsWith("Witness"));

describe("testamentarySignatureLines — derived from the ruleset", () => {
  it("emits one witness line per required witness", () => {
    for (const n of [1, 2, 3]) {
      const lines = testamentarySignatureLines({
        ruleset: ruleset({ witnessesRequired: n }),
        signerRole: "Testator: Jane Doe",
      });
      expect(witnessLines(lines)).toHaveLength(n);
    }
  });

  it("adds a notary line when the self-proving affidavit requires one", () => {
    const lines = testamentarySignatureLines({
      ruleset: ruleset({ selfProvingAffidavit: { available: true, requiresNotary: true } }),
      signerRole: "Testator: Jane Doe",
    });
    expect(notaryLines(lines)).toHaveLength(1);
  });

  it("omits the notary line where an unsworn declaration is accepted", () => {
    // Indiana and Nevada: the self-proving clause is a declaration under penalty
    // of perjury. Printing a notary block there asserts a requirement that does
    // not exist — checklist item A7 calls this out explicitly for Indiana.
    const lines = testamentarySignatureLines({
      ruleset: ruleset({
        state: "IN",
        selfProvingAffidavit: { available: true, requiresNotary: false },
      }),
      signerRole: "Testator: Jane Doe",
    });
    expect(notaryLines(lines)).toHaveLength(0);
  });

  it("adds a notary line when the state notarizes the instrument itself", () => {
    // Regression guard: notarizationRequired was previously read only by the
    // execution-instructions page and never by the document assembler.
    const lines = testamentarySignatureLines({
      ruleset: ruleset({
        notarizationRequired: true,
        selfProvingAffidavit: { available: false, requiresNotary: false },
      }),
      signerRole: "Testator: Jane Doe",
    });
    expect(notaryLines(lines)).toHaveLength(1);
  });

  it("never duplicates a line supplied by a researched clause block", () => {
    const lines = testamentarySignatureLines({
      ruleset: ruleset(),
      signerRole: "Testator: Jane Doe",
      clauseSignatureLines: ["Testator: Jane Doe", "Notary Public", "Official seal"],
    });
    expect(lines.filter((l) => l === "Testator: Jane Doe")).toHaveLength(1);
    expect(lines).toContain("Official seal");
  });
});

describe("pour-over will — parity with the main will", () => {
  it("carries a self-proving affidavit, as the main will does", () => {
    // Before this change the pour-over will emitted no affidavit in any state,
    // so a trust customer's will was less provable at probate than an identical
    // will-package customer's in the same jurisdiction.
    const po = assemblePouroverWill({ answers, ruleset: ruleset() });
    expect(po.sections.map((s) => s.heading)).toContain("Self-Proving Affidavit");
  });

  it("produces the same notary and witness disposition as the main will", () => {
    for (const rs of [
      ruleset({ state: "TX" }),
      ruleset({ state: "IN", selfProvingAffidavit: { available: true, requiresNotary: false } }),
      ruleset({ state: "CA", selfProvingAffidavit: { available: false, requiresNotary: false } }),
      ruleset({ state: "AZ", witnessesRequired: 2, notarizationRequired: true }),
    ]) {
      const will = assembleWill({ answers, ruleset: rs });
      const po = assemblePouroverWill({ answers, ruleset: rs });
      expect(notaryLines(po.signatureLines).length).toBe(
        notaryLines(will.signatureLines).length,
      );
      expect(witnessLines(po.signatureLines).length).toBe(
        witnessLines(will.signatureLines).length,
      );
    }
  });
});

describe("instruments with no recorded execution rules fail closed", () => {
  it("classifies only the testamentary instruments as rule-backed", () => {
    expect(hasRecordedExecutionRules("will")).toBe(true);
    expect(hasRecordedExecutionRules("pourover")).toBe(true);
    for (const k of ["trust", "poa", "healthcare", "hipaa"] as const) {
      expect(hasRecordedExecutionRules(k)).toBe(false);
    }
  });

  it("the trust no longer asserts a notary requirement in every state", () => {
    // Fla. Stat. § 736.0403(2)(b) requires WILL formalities for a Florida
    // settlor's revocable trust; the old block printed a notary line and no
    // witnesses in all 51 jurisdictions.
    for (const state of ["FL", "TX", "CA", "NV"]) {
      const t = assembleTrust({ answers, ruleset: ruleset({ state }) });
      expect(notaryLines(t.signatureLines)).toHaveLength(0);
      expect(t.signatureLines).toContain(PENDING_EXECUTION_BLOCK_LINE);
    }
  });

  it("the trust tells the reader its formalities are unestablished", () => {
    const t = assembleTrust({ answers, ruleset: ruleset({ state: "FL" }) });
    const text = t.sections.flatMap((s) => s.paragraphs).join(" ");
    expect(text).toContain("[ATTORNEY REVIEW REQUIRED]");
    expect(text.toLowerCase()).toContain("not yet recorded");
  });

  it("the POA no longer prints a notary line in every state", () => {
    const poa = assemblePoa({ answers, ruleset: ruleset({ state: "CA" }) });
    expect(notaryLines(poa.signatureLines)).toHaveLength(0);
    expect(poa.signatureLines).toContain(PENDING_EXECUTION_BLOCK_LINE);
  });

  it("the healthcare directive no longer hardcodes two witnesses", () => {
    const hc = assembleHealthcare({ answers, ruleset: ruleset({ state: "AZ" }) });
    expect(witnessLines(hc.signatureLines)).toHaveLength(0);
    expect(hc.signatureLines).toContain(PENDING_EXECUTION_BLOCK_LINE);
  });

  it("leaves the HIPAA authorization alone — 45 CFR 164.508 needs no witness or notary", () => {
    const h = assembleHipaa({ answers, ruleset: ruleset() });
    expect(h.signatureLines).toEqual(["Individual: Jane Doe", "Date"]);
  });
});

describe("ancillary notices describe the draft truthfully", () => {
  it("no longer claims the state's statutory form is used verbatim", () => {
    // docs/STATE_COMPLIANCE_DOSSIER.md §4: "The document is making a false
    // statement about itself." No statutory form text exists for any state.
    for (const doc of [
      assemblePoa({ answers, ruleset: ruleset() }),
      assembleHealthcare({ answers, ruleset: ruleset() }),
    ]) {
      const text = doc.sections.flatMap((s) => s.paragraphs).join(" ");
      expect(text).not.toContain("that form is used verbatim");
      expect(text).toContain("no statutory form text has been incorporated");
    }
  });
});
