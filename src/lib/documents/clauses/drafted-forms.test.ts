import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DRAFTED_FORMS } from "./drafted-forms";
import {
  selfProvingAffidavitFor,
  draftedFromRuleStates,
  verbatimStates,
  noKnownMechanismStates,
} from "./self-proving-affidavit";

/**
 * Safety net for the DRAFTED tier.
 *
 * The verbatim test (self-proving-affidavit.statutes.test.ts) asks "does our
 * wording appear in the statute?". That question is unanswerable here: these
 * states prescribe no form, so there is no wording to match. Asking it anyway
 * would only tempt someone to loosen it until it proved nothing.
 *
 * What CAN be checked mechanically is coverage: each state's statute names the
 * things an affidavit has to establish, and the draft should address every one.
 * That is what this file asserts.
 *
 * WHAT THIS DOES NOT PROVE. Coverage is not sufficiency. A draft can touch every
 * element the statute lists and still be legally inadequate — wrong affiant,
 * wrong timing, wrong instrument, or simply not what that state's probate courts
 * accept in practice. Only counsel can close that gap. This test exists so that
 * a reviewer's edits cannot silently drop a statutory element, not to suggest the
 * text is approved.
 */

const ROOT = join(process.cwd(), "docs/statutes");
const ctx = {
  testatorName: "Jane Doe",
  stateName: "Testland",
  witnessCount: 2,
  requiresNotary: true,
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ");

describe("drafted-from-rule clauses", () => {
  it("never overlaps the verbatim tier", () => {
    // A state with a prescribed form must use it. If a state ever appears in
    // both maps the verbatim spread would win silently, and the drafted text
    // would sit in the file looking authoritative while being dead code.
    const overlap = draftedFromRuleStates().filter((s) => verbatimStates().includes(s));
    expect(overlap, `drafted AND verbatim: ${overlap.join(", ")}`).toEqual([]);
  });

  it("never overlaps the no-known-mechanism tier", () => {
    const overlap = draftedFromRuleStates().filter((s) =>
      noKnownMechanismStates().includes(s),
    );
    expect(overlap, `drafted AND no-mechanism: ${overlap.join(", ")}`).toEqual([]);
  });

  for (const [state, form] of Object.entries(DRAFTED_FORMS)) {
    describe(state, () => {
      const drafted = norm(selfProvingAffidavitFor(state, ctx).paragraphs.join(" "));

      it("covers every element its statute requires", () => {
        for (const req of form.requirements) {
          for (const phrase of req.mustAppear) {
            expect(
              drafted,
              `${state}: draft does not address ${req.source} — "${req.element}" ` +
                `(missing wording: "${phrase}")`,
            ).toContain(norm(phrase));
          }
        }
      });

      it("cites a statute we have actually captured", () => {
        const path = join(ROOT, `${state}_self_proving_affidavit.json`);
        expect(existsSync(path), `no capture for ${state}`).toBe(true);
        const cap = JSON.parse(readFileSync(path, "utf8"));
        expect(form.citation).toBe(cap.citation);
        expect(form.sourceUrl).toBe(cap.sourceUrl);
      });

      it("does not read as a reproduction of a statute", () => {
        // Guards the honesty of the packet: provenance must say drafted, and the
        // review note must carry the attorney flag. If someone later promotes
        // one of these to "verbatim" without capturing a real form, this fails.
        const p = selfProvingAffidavitFor(state, ctx).provenance;
        expect(p.fidelity).toBe("drafted_from_rule");
        expect(p.status).not.toBe("attorney_approved");
        expect(p.reviewNote).toContain("ATTORNEY REVIEW REQUIRED");
        expect(p.reviewNote).toContain("DRAFTED BY A NON-LAWYER");
      });

      it("gives counsel something specific to decide", () => {
        expect(form.counselQuestions.length).toBeGreaterThan(0);
        for (const q of form.counselQuestions) expect(q.length).toBeGreaterThan(20);
      });
    });
  }
});

describe("no-known-mechanism jurisdictions", () => {
  for (const state of noKnownMechanismStates()) {
    it(`${state} carries the threshold question, not an invented form`, () => {
      const clause = selfProvingAffidavitFor(state, ctx);
      expect(clause.provenance.reviewNote).toContain("THRESHOLD QUESTION");
      expect(clause.provenance.fidelity).toBe("drafted_from_rule");
      // The whole point is that we did NOT write an affidavit for these. If a
      // future change gives them real affidavit text, this should fail loudly so
      // the decision is made deliberately rather than by drift.
      expect(clause.paragraphs.length).toBeLessThanOrEqual(2);
    });
  }
});
