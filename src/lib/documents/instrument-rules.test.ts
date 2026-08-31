import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeStateRules, ruleSourceFor } from "./state-rules";
import { assemblePouroverWill } from "./trust";
import { assembleWill } from "./will";

/**
 * Migration 0017 — separating "which instrument" from "which package was sold".
 *
 * The bug this guards against was invisible in every existing test, because the
 * tests build a ruleset by hand and the defect lived in which rows the DATABASE
 * hands back. `getStateRuleset` was called with `matter.doc_type` — the package —
 * so a trust customer's query asked for doc_type='trust' rows, of which the seed
 * has none for any state. The pour-over will was then assembled from a ruleset
 * containing nothing but the two NULL-doc_type rows.
 */

const ROOT = join(__dirname, "../../..");
const seed = readFileSync(join(ROOT, "supabase/seed.sql"), "utf8");

/** Rule keys that belong to an instrument, mirroring the DB CHECK constraint. */
const STATE_LEVEL_KEYS = new Set(["community_property"]);

const answers = {
  about: { fullName: "Jane Doe", maritalStatus: "single", state: "FL" },
  family: { children: [] },
  fiduciaries: { executorName: "Sam Smith", successorTrusteeName: "Sam Smith" },
  distributions: { beneficiaries: [{ name: "Kid A", percent: "100" }] },
  ancillary: {},
};

describe("ruleSourceFor — document kind to the instrument that governs it", () => {
  it("routes a pour-over will to WILL rules, not trust rules", () => {
    // The whole point. A pour-over will is admitted to probate like any other
    // will; the package the customer bought does not change its formalities.
    expect(ruleSourceFor("pourover")).toBe("will");
  });

  it("routes the self-proving affidavit to will rules", () => {
    expect(ruleSourceFor("affidavit")).toBe("will");
  });

  it("leaves every other instrument as itself", () => {
    expect(ruleSourceFor("will")).toBe("will");
    expect(ruleSourceFor("trust")).toBe("trust");
    expect(ruleSourceFor("poa")).toBe("poa");
    expect(ruleSourceFor("healthcare")).toBe("healthcare");
    expect(ruleSourceFor("hipaa")).toBe("hipaa");
  });
});

describe("seed obeys the instrument-scope rule the DB constraint enforces", () => {
  // Catches a bad seed before `db:push` hits state_rules_instrument_scope_chk.
  const rows = [
    ...seed.matchAll(
      /\('([A-Z]{2})', (null|'[a-z]+'), '([a-z_]+)'/g,
    ),
  ].map((m) => ({ state: m[1], instrument: m[2], key: m[3] }));

  it("parsed the seed", () => {
    expect(rows.length).toBeGreaterThan(300);
  });

  it("gives every instrument-scoped rule an instrument", () => {
    const bad = rows.filter(
      (r) => !STATE_LEVEL_KEYS.has(r.key) && r.instrument === "null",
    );
    expect(bad.map((b) => `${b.state}/${b.key}`)).toEqual([]);
  });

  it("leaves state-level facts unscoped", () => {
    const bad = rows.filter(
      (r) => STATE_LEVEL_KEYS.has(r.key) && r.instrument !== "null",
    );
    expect(bad.map((b) => `${b.state}/${b.key}`)).toEqual([]);
  });

  it("no longer seeds notarization as a state-level fact", () => {
    // It was NULL for all 51 states under the old "applies to both" reading,
    // while every citation on those rows spoke only of wills.
    const notarization = rows.filter(
      (r) => r.key === "notarization_required_for_document",
    );
    expect(notarization).toHaveLength(51);
    expect(notarization.every((r) => r.instrument === "'will'")).toBe(true);
  });
});

describe("a Florida trust customer's pour-over will", () => {
  // What `getStateRuleset(state, 'trust')` used to return: no doc_type='trust'
  // rows exist, so only the two NULL rows came back.
  const rowsBefore = [
    {
      rule_key: "notarization_required_for_document",
      rule_value: { required: false },
      citation: "Attested will valid without notarization — verify",
      needs_review: true,
    },
    {
      rule_key: "community_property",
      rule_value: { community_property: false },
      citation: "Common-law (separate property) state",
      needs_review: true,
    },
  ];

  // What `getStateRuleset(state, ruleSourceFor('pourover'))` returns now: the
  // will rows for Florida, plus the state-level row. Values match seed.sql.
  const rowsAfter = [
    ...rowsBefore.filter((r) => r.rule_key === "community_property"),
    {
      rule_key: "notarization_required_for_document",
      rule_value: { required: false },
      citation: "Attested will valid without notarization — verify",
      needs_review: true,
    },
    {
      rule_key: "witnesses_required",
      rule_value: { count: 2 },
      citation: "Fla. Stat. §732.502",
      needs_review: true,
    },
    {
      rule_key: "self_proving_affidavit",
      rule_value: { available: true, requires_notary: true },
      citation: "Fla. Stat. §732.503",
      needs_review: true,
    },
    {
      rule_key: "signature_at_end_required",
      rule_value: { required: true },
      citation: "Fla. Stat. §732.502",
      needs_review: true,
    },
  ];

  it("USED to lose its self-proving affidavit entirely", () => {
    const rs = normalizeStateRules("FL", rowsBefore);
    expect(rs.selfProvingAffidavit.available).toBe(false);
    const po = assemblePouroverWill({ answers, ruleset: rs });
    expect(po.sections.map((s) => s.heading)).not.toContain(
      "Self-Proving Affidavit",
    );
    expect(po.signatureLines.some((l) => /notar/i.test(l))).toBe(false);
  });

  it("USED to lose Florida's signature-at-the-end requirement", () => {
    const rs = normalizeStateRules("FL", rowsBefore);
    expect(rs.signatureAtEndRequired).toBe(false);
  });

  it("now carries the affidavit and Florida's own execution block", () => {
    const rs = normalizeStateRules("FL", rowsAfter);
    expect(rs.selfProvingAffidavit.available).toBe(true);
    expect(rs.signatureAtEndRequired).toBe(true);

    const po = assemblePouroverWill({ answers, ruleset: rs });
    expect(po.sections.map((s) => s.heading)).toContain("Self-Proving Affidavit");

    // Florida is a researched state, so the clause supplies the execution block
    // printed in Fla. Stat. § 732.503 itself. That form says "officer", not
    // "notary" — asserting on the word "notary" would be asserting on our own
    // generic wording rather than on the statute's.
    const lines = po.signatureLines.join(" | ");
    expect(lines).toContain("Official capacity of officer");
    expect(lines).toContain("My commission expires");
    expect(lines).toContain("(Official seal)");
  });

  it("now matches an identical will-package customer in the same state", () => {
    // The parity defect the execution-block work set out to fix. It was correct
    // at the assembler and inert in production until the rules query was scoped
    // by instrument rather than by package. Compare the blocks outright.
    const rs = normalizeStateRules("FL", rowsAfter);
    const will = assembleWill({ answers, ruleset: rs });
    const po = assemblePouroverWill({ answers, ruleset: rs });

    expect(po.signatureLines).toEqual(will.signatureLines);
    expect(po.sections.map((s) => s.heading)).toContain("Self-Proving Affidavit");
    expect(will.sections.map((s) => s.heading)).toContain("Self-Proving Affidavit");
  });
});
