import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  normalizeStateRules,
  parseExecutionAlternatives,
  type StateRuleRow,
} from "./state-rules";
import { assemblePoa } from "./ancillary";
import {
  alternativeExecutionLines,
  describeExecutionOption,
} from "./execution-block";

/**
 * Disjunctions — states that accept EITHER of two rituals rather than requiring
 * both parts of one.
 *
 * `witnesses_required` + `notarization_required_for_document` can only express a
 * conjunction. Cal. Prob. Code § 4402 accepts a POA acknowledged before a notary
 * OR signed before two witnesses, and every way of forcing that into the two
 * older keys asserts something untrue. `execution_alternatives` is the shape that
 * holds it.
 */

const answers = {
  about: { fullName: "Jane Doe", maritalStatus: "single" },
  family: { children: [] },
  fiduciaries: { executorName: "Sam Smith" },
  distributions: { beneficiaries: [] },
  ancillary: { financialPoaAgent: "Sam Smith" },
};

const witnessLines = (lines: string[]) => lines.filter((l) => l.startsWith("Witness"));
const notaryLines = (lines: string[]) =>
  lines.filter((l) => l === "Notary Public");

describe("parseExecutionAlternatives", () => {
  it("reads a two-branch disjunction", () => {
    const parsed = parseExecutionAlternatives({
      any_of: [
        { witnesses: 2, notary: false },
        { witnesses: 0, notary: true },
      ],
    });
    expect(parsed).toEqual([
      { witnesses: 2, notary: false },
      { witnesses: 0, notary: true },
    ]);
  });

  it("returns null for anything malformed, so a bad row cannot empty the block", () => {
    // Falling back to the conjunction path is safe. Producing an empty choice
    // would print a document with nowhere to sign.
    for (const bad of [
      undefined,
      null,
      {},
      { any_of: [] },
      { any_of: [{ witnesses: 2, notary: false }] }, // one branch is not a choice
      { any_of: [{ witnesses: 2 }, { notary: true }] }, // missing halves
      { any_of: [{ witnesses: "two", notary: false }, { witnesses: 0, notary: true }] },
      { any_of: [{ witnesses: 0, notary: false }, { witnesses: 2, notary: false }] }, // a branch requiring nothing
    ]) {
      expect(parseExecutionAlternatives(bad)).toBeNull();
    }
  });
});

describe("describeExecutionOption", () => {
  it("words each branch without storing prose in the database", () => {
    expect(describeExecutionOption({ witnesses: 2, notary: false })).toBe("2 witnesses");
    expect(describeExecutionOption({ witnesses: 1, notary: false })).toBe("one witness");
    expect(describeExecutionOption({ witnesses: 0, notary: true })).toBe("notarization");
    expect(describeExecutionOption({ witnesses: 1, notary: true })).toBe(
      "one witness and notarization",
    );
  });
});

describe("alternativeExecutionLines", () => {
  const lines = alternativeExecutionLines([
    { witnesses: 2, notary: false },
    { witnesses: 0, notary: true },
  ]);

  it("prints both branches, labelled, rather than merging them", () => {
    // Merging would demand two witnesses AND a notary, overstating the law.
    expect(lines.some((l) => l.includes("Option 1: 2 witnesses"))).toBe(true);
    expect(lines.some((l) => l.includes("Option 2: notarization"))).toBe(true);
    expect(witnessLines(lines)).toHaveLength(2);
    expect(notaryLines(lines)).toHaveLength(1);
  });

  it("tells the signer to complete exactly one", () => {
    const text = lines.join(" ");
    expect(text).toContain("EITHER");
    expect(text).toContain("Complete ONE");
    expect(text).toContain("[ATTORNEY REVIEW REQUIRED]");
  });

  it("warns that the branches are not equivalent in consequence", () => {
    // Only the notarized route carries California's § 4406 duty to accept, so
    // presenting the choice as a free one would be misleading.
    expect(lines.join(" ")).toContain("accept");
  });
});

describe("a disjunction reaches the document", () => {
  const rows: StateRuleRow[] = [
    {
      rule_key: "execution_alternatives",
      rule_value: {
        any_of: [
          { witnesses: 2, notary: false },
          { witnesses: 0, notary: true },
        ],
      },
      citation: "Cal. Prob. Code §4402",
      needs_review: true,
      instrument: "poa",
    },
  ];

  it("replaces the conjunction block rather than adding to it", () => {
    const rs = normalizeStateRules("CA", rows, "poa");
    expect(rs.executionAlternatives).toHaveLength(2);
    const poa = assemblePoa({ answers, ruleset: rs });
    expect(poa.signatureLines.join(" ")).toContain("Option 1");
    expect(poa.signatureLines.join(" ")).toContain("Option 2");
  });

  it("leaves states without the key on the ordinary conjunction path", () => {
    const rs = normalizeStateRules(
      "FL",
      [
        {
          rule_key: "witnesses_required",
          rule_value: { count: 2 },
          instrument: "poa",
        },
        {
          rule_key: "notarization_required_for_document",
          rule_value: { required: true },
          instrument: "poa",
        },
      ],
      "poa",
    );
    expect(rs.executionAlternatives).toBeNull();
    const poa = assemblePoa({ answers, ruleset: rs });
    expect(poa.signatureLines.join(" ")).not.toContain("Option 1");
    expect(witnessLines(poa.signatureLines)).toHaveLength(2);
    expect(notaryLines(poa.signatureLines)).toHaveLength(1);
  });
});

describe("the Florida POA pilot, from the seed", () => {
  // One real state end to end, per docs/ANCILLARY_RULES_GAPS.md. Reads the seed
  // so the test fails if the pilot rows are removed or altered.
  const seed = readFileSync(join(__dirname, "../../..", "supabase/seed.sql"), "utf8");
  const poaRows = [
    ...seed.matchAll(/\('([A-Z]{2})', 'poa', '([a-z_]+)', '([^']*)'::jsonb, '([^']*)'/g),
  ].map((m) => ({ state: m[1], key: m[2], value: JSON.parse(m[3]), citation: m[4] }));

  it("seeds Florida and only Florida for now", () => {
    expect([...new Set(poaRows.map((r) => r.state))]).toEqual(["FL"]);
  });

  it("records two witnesses and a notary, each cited to § 709.2105", () => {
    const witnesses = poaRows.find((r) => r.key === "witnesses_required");
    const notary = poaRows.find(
      (r) => r.key === "notarization_required_for_document",
    );
    expect(witnesses?.value).toEqual({ count: 2 });
    expect(notary?.value).toEqual({ required: true });
    for (const r of poaRows) expect(r.citation).toContain("709.2105");
  });

  it("produces a Florida POA block matching the statute", () => {
    const rs = normalizeStateRules(
      "FL",
      poaRows.map((r) => ({
        rule_key: r.key,
        rule_value: r.value,
        citation: r.citation,
        needs_review: true,
        instrument: "poa" as const,
      })),
      "poa",
    );
    const poa = assemblePoa({ answers, ruleset: rs });
    expect(witnessLines(poa.signatureLines)).toHaveLength(2);
    expect(notaryLines(poa.signatureLines)).toHaveLength(1);
    expect(poa.signatureLines.some((l) => l.includes("pending attorney review"))).toBe(
      false,
    );
  });

  it("still says the document is not complete", () => {
    // Fla. Stat. § 709.2202 superpower initialing is not generated. A correct
    // block must not imply it is handled.
    const rs = normalizeStateRules(
      "FL",
      poaRows.map((r) => ({
        rule_key: r.key,
        rule_value: r.value,
        instrument: "poa" as const,
      })),
      "poa",
    );
    const text = assemblePoa({ answers, ruleset: rs })
      .sections.flatMap((s) => s.paragraphs)
      .join(" ");
    expect(text).toContain("does NOT mean the document is complete");
  });

  it("leaves every other state's POA failing closed", () => {
    // Nothing is seeded for them, so the ruleset reports no recorded rules.
    for (const state of ["CA", "NV", "AZ", "TX"]) {
      const rs = normalizeStateRules(
        state,
        [
          {
            rule_key: "community_property",
            rule_value: { community_property: false },
            instrument: null,
          },
        ],
        "poa",
      );
      expect(rs.hasRecordedRules).toBe(false);
      const poa = assemblePoa({ answers, ruleset: rs });
      expect(poa.signatureLines.some((l) => l.includes("pending attorney review"))).toBe(
        true,
      );
    }
  });
});
