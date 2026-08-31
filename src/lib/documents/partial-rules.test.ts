import { describe, it, expect } from "vitest";
import {
  normalizeStateRules,
  parseExecutionAlternatives,
  type StateRuleRow,
} from "./state-rules";
import { assemblePoa, assembleHealthcare } from "./ancillary";
import { assembleTrust } from "./trust";
import { PENDING_EXECUTION_BLOCK_LINE } from "./execution-block";

/**
 * Regressions from the pre-merge review.
 *
 * The defect these guard against was live on this branch and caught by nothing:
 * `hasRecordedRules` asked only whether SOME row existed for a (state,
 * instrument), while the block it gates reads `witnessesRequired` — which falls
 * back to a hardcoded 2 — and `notarizationRequired`. So a single recorded key
 * switched the block on and the missing halves were invented, under a notice
 * telling the customer the block reflected their state's recorded requirements.
 *
 * It was one missing seed row away in every state added after Florida, and the
 * documented rollout path ("an ANCILLARY entry plus a citation, and the state
 * flips itself on") invites exactly that mistake.
 */

const answers = {
  about: { fullName: "Jane Doe", maritalStatus: "single" },
  family: { children: [] },
  fiduciaries: { executorName: "Sam Smith", successorTrusteeName: "Sam Smith" },
  distributions: { beneficiaries: [] },
  ancillary: { financialPoaAgent: "Sam Smith", healthcareAgent: "Sam Smith" },
};

const stateLevel: StateRuleRow = {
  rule_key: "community_property",
  rule_value: { community_property: false },
  instrument: null,
};

const witnessLines = (lines: string[]) => lines.filter((l) => l.startsWith("Witness"));
const notaryLines = (lines: string[]) => lines.filter((l) => l === "Notary Public");

describe("a partially recorded instrument fails closed", () => {
  it("does not invent witnesses from a notarization-only row", () => {
    // Nevada, exactly as docs/ANCILLARY_RULES_GAPS.md §2 describes it: the
    // notarization finding lands first. Nevada requires NO witnesses, and the
    // code fallback is 2 — so the old behaviour printed two witness lines that
    // no row supported.
    const rs = normalizeStateRules(
      "NV",
      [
        {
          rule_key: "notarization_required_for_document",
          rule_value: { required: true },
          citation: "NRS §162A.220",
          instrument: "poa",
        },
        stateLevel,
      ],
      "poa",
    );
    expect(rs.hasRecordedRules).toBe(false);

    const poa = assemblePoa({ answers, ruleset: rs });
    expect(witnessLines(poa.signatureLines)).toEqual([]);
    expect(poa.signatureLines).toContain(PENDING_EXECUTION_BLOCK_LINE);
  });

  it("does not invent a missing notarization answer from a witness-only row", () => {
    // Arizona: one witness AND a notary. With only the witness row recorded, the
    // old behaviour printed one witness line and NO notary line, understating
    // the ritual while certifying it was Arizona's recorded requirement.
    const rs = normalizeStateRules(
      "AZ",
      [
        {
          rule_key: "witnesses_required",
          rule_value: { count: 1 },
          citation: "A.R.S. §14-5501",
          instrument: "poa",
        },
        stateLevel,
      ],
      "poa",
    );
    expect(rs.hasRecordedRules).toBe(false);
    expect(assemblePoa({ answers, ruleset: rs }).signatureLines).toContain(
      PENDING_EXECUTION_BLOCK_LINE,
    );
  });

  it("is not switched on by a row that says nothing about execution", () => {
    const rs = normalizeStateRules(
      "FL",
      [
        {
          rule_key: "signature_at_end_required",
          rule_value: { required: true },
          instrument: "trust",
        },
        stateLevel,
      ],
      "trust",
    );
    expect(rs.hasRecordedRules).toBe(false);
    expect(assembleTrust({ answers, ruleset: rs }).signatureLines).toContain(
      PENDING_EXECUTION_BLOCK_LINE,
    );
  });

  it("is not switched on by state-level rows alone", () => {
    const rs = normalizeStateRules("TX", [stateLevel], "healthcare");
    expect(rs.hasRecordedRules).toBe(false);
    expect(rs.recordedRuleKeys).toEqual([]);
    expect(assembleHealthcare({ answers, ruleset: rs }).signatureLines).toContain(
      PENDING_EXECUTION_BLOCK_LINE,
    );
  });

  it("switches on only when BOTH execution keys are recorded", () => {
    const rs = normalizeStateRules(
      "FL",
      [
        { rule_key: "witnesses_required", rule_value: { count: 2 }, instrument: "poa" },
        {
          rule_key: "notarization_required_for_document",
          rule_value: { required: true },
          instrument: "poa",
        },
        stateLevel,
      ],
      "poa",
    );
    expect(rs.hasRecordedRules).toBe(true);
    const poa = assemblePoa({ answers, ruleset: rs });
    expect(witnessLines(poa.signatureLines)).toHaveLength(2);
    expect(notaryLines(poa.signatureLines)).toHaveLength(1);
  });

  it("distinguishes 'recorded as zero' from 'not researched'", () => {
    // A state that genuinely requires no witnesses must be recordable as such,
    // and must NOT be mistaken for an unresearched state.
    const rs = normalizeStateRules(
      "NV",
      [
        { rule_key: "witnesses_required", rule_value: { count: 0 }, instrument: "poa" },
        {
          rule_key: "notarization_required_for_document",
          rule_value: { required: false },
          instrument: "poa",
        },
      ],
      "poa",
    );
    expect(rs.hasRecordedRules).toBe(true);
    expect(rs.recordedRuleKeys).toContain("witnesses_required");
    const poa = assemblePoa({ answers, ruleset: rs });
    expect(witnessLines(poa.signatureLines)).toEqual([]);
    expect(notaryLines(poa.signatureLines)).toEqual([]);
    expect(poa.signatureLines).not.toContain(PENDING_EXECUTION_BLOCK_LINE);
  });
});

describe("parseExecutionAlternatives rejects counts that cannot be signed", () => {
  it("rejects a fractional count that would print a header with no lines", () => {
    // 0.5 passed the old `witnesses <= 0` guard, then the render loop never ran:
    // "— Option 1: 0.5 witnesses —" with nothing beneath it.
    expect(
      parseExecutionAlternatives({
        any_of: [
          { witnesses: 0.5, notary: false },
          { witnesses: 0, notary: true },
        ],
      }),
    ).toBeNull();
  });

  it("rejects a fractional count whose label and lines would disagree", () => {
    expect(
      parseExecutionAlternatives({
        any_of: [
          { witnesses: 2.5, notary: false },
          { witnesses: 0, notary: true },
        ],
      }),
    ).toBeNull();
  });

  it("rejects negative counts", () => {
    expect(
      parseExecutionAlternatives({
        any_of: [
          { witnesses: -1, notary: false },
          { witnesses: 0, notary: true },
        ],
      }),
    ).toBeNull();
  });

  it("rejects duplicate branches, which are one requirement not a choice", () => {
    expect(
      parseExecutionAlternatives({
        any_of: [
          { witnesses: 2, notary: true },
          { witnesses: 2, notary: true },
        ],
      }),
    ).toBeNull();
  });

  it("still accepts a genuine two-branch choice", () => {
    expect(
      parseExecutionAlternatives({
        any_of: [
          { witnesses: 2, notary: false },
          { witnesses: 0, notary: true },
        ],
      }),
    ).toHaveLength(2);
  });
});

describe("execution_alternatives is refused where nothing honours it", () => {
  const altRow: StateRuleRow = {
    rule_key: "execution_alternatives",
    rule_value: {
      any_of: [
        { witnesses: 2, notary: false },
        { witnesses: 0, notary: true },
      ],
    },
    citation: "C.R.S. 15-11-502(2)",
    instrument: "will",
  };

  it("ignores a will-scoped row rather than silently printing the conjunction", () => {
    // testamentarySignatureLines does not read alternatives, and the will's
    // attestation prose states a witness count in drafted language that no
    // disjunction satisfies. Half-honouring it would ship a document whose
    // signature block and attestation contradict each other.
    const rs = normalizeStateRules("CO", [altRow], "will");
    expect(rs.executionAlternatives).toBeNull();
  });

  it("flags that refusal for review rather than dropping it quietly", () => {
    const rs = normalizeStateRules("CO", [altRow], "will");
    expect(rs.needsReview).toBe(true);
  });

  it("still honours it for the instruments that do read it", () => {
    const rs = normalizeStateRules("CA", [{ ...altRow, instrument: "poa" }], "poa");
    expect(rs.executionAlternatives).toHaveLength(2);
    expect(rs.hasRecordedRules).toBe(true);
  });

  it("flags a malformed alternatives row instead of falling back to a conjunction", () => {
    // The row exists because the conjunction is the wrong answer for this state.
    const rs = normalizeStateRules(
      "CA",
      [
        {
          rule_key: "execution_alternatives",
          rule_value: { any_of: [{ witnesses: 0.5, notary: false }] },
          instrument: "poa",
        },
      ],
      "poa",
    );
    expect(rs.executionAlternatives).toBeNull();
    expect(rs.needsReview).toBe(true);
  });
});
