import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { selfProvingAffidavitFor, verbatimStates } from "./self-proving-affidavit";

/**
 * Cross-check every researched clause against the statute it claims to track.
 *
 * The drafted text and the captured statute are maintained separately: one is
 * TypeScript we wrote, the other is verbatim text harvested from the state's own
 * publisher. Nothing stops them drifting apart — a typo, a wrong variant flag, or
 * a statute amended after we drafted against it.
 *
 * So this test reads the capture in docs/statutes and asserts the distinctive
 * phrases in our draft actually appear in that state's statute. A wrong variant
 * ("as my will" where the statute says "as my last will") fails here rather than
 * reaching a customer's document.
 *
 * This proves the draft TRACKS THE SOURCE. It does not prove the draft is legally
 * sufficient — only counsel can say that.
 */

const STATUTES_DIR = join(process.cwd(), "docs/statutes");

/**
 * Normalize for comparison: statutes render blanks in wildly different ways
 * (____, ......, ………) and wrap lines unpredictably. Collapse all of that so we
 * compare wording, not typography.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[_.…]{2,}/g, " ") // blanks of any style
    .replace(/\s+/g, " ")
    .replace(/[’']/g, "'")
    .trim();
}

function loadStatute(state: string): string | null {
  const p = join(STATUTES_DIR, `${state}_self_proving_affidavit.json`);
  if (!existsSync(p)) return null;
  return normalize(JSON.parse(readFileSync(p, "utf8")).text);
}

function loadCitation(state: string): string | null {
  const p = join(STATUTES_DIR, `${state}_self_proving_affidavit.json`);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8")).citation;
}

const ctx = {
  testatorName: "Jane Doe",
  stateName: "Test State",
  witnessCount: 2,
  requiresNotary: true,
};

/**
 * Phrases that must appear in the source statute. Each is a wording choice we
 * made from that state's variant, so a mismatch means the draft is wrong.
 */
const MUST_APPEAR = [
  "sign my name to this instrument",
  "being first duly sworn",
  "to the undersigned authority",
  "willingly direct another to sign for me",
  "free and voluntary act",
  "eighteen years of age or older",
  "of sound mind",
  "under no constraint or undue influence",
  "in the presence and hearing of the testator",
];

describe("researched clauses track their source statute", () => {
  // ONLY the verbatim tier. States that prescribe no form are covered instead by
  // drafted-forms.test.ts, which asserts element coverage — see the note on
  // verbatimStates() for why the two must not be merged.
  const states = verbatimStates();

  it("has captured a statute for every researched state", () => {
    const missing = states.filter((s) => loadStatute(s) === null);
    expect(missing, `no capture in docs/statutes for: ${missing.join(", ")}`).toEqual([]);
  });

  for (const state of states) {
    describe(state, () => {
      const statute = loadStatute(state);
      if (!statute) return; // reported by the test above

      it("cites the same statute the capture records", () => {
        // Compare against the capture's own citation rather than hunting the
        // section number in the body: some captures are anchored on the section
        // TITLE (the bare number also appears in site navigation), so the number
        // legitimately does not appear in the captured text.
        const clause = selfProvingAffidavitFor(state, ctx);
        expect(clause.provenance.citation).toBe(loadCitation(state));
      });

      it("uses only wording that appears in the statute", () => {
        const drafted = normalize(
          selfProvingAffidavitFor(state, ctx).paragraphs.join(" "),
        );
        for (const phrase of MUST_APPEAR) {
          // Only assert phrases our draft actually uses — states differ.
          if (!drafted.includes(phrase)) continue;
          expect(statute, `${state}: "${phrase}" is not in the captured statute`).toContain(
            phrase,
          );
        }
      });

      /**
       * The strong check. Spot-checking known phrases only catches wording we
       * thought to list; it missed, for example, that most states close with "for
       * the purposes THEREIN EXPRESSED" while our template said "expressed in that
       * document".
       *
       * So instead: take the drafted testator paragraph, cut it at the variable
       * parts (the testator's name and the date blanks), and require every
       * remaining run of prose to appear verbatim in the statute. Any wording we
       * invented shows up as a run that is not in the source.
       */
      it("every fixed run of drafted prose appears verbatim in the statute", () => {
        const clause = selfProvingAffidavitFor(state, ctx);
        const testatorPara = normalize(clause.paragraphs[0]);

        const runs = testatorPara
          // Cut at the values we substitute in: the name and the blanks.
          .split(/jane doe|\b20\b|\bthis\b\s+\bday of\b/)
          .map((r) => r.replace(/^[\s,.;:]+|[\s,.;:]+$/g, "").trim())
          // Ignore fragments too short to be meaningful evidence.
          .filter((r) => r.length >= 25);

        expect(runs.length, `${state}: no comparable prose runs`).toBeGreaterThan(0);

        const missing = runs.filter((r) => !statute.includes(r));
        expect(
          missing,
          `${state}: drafted wording not found in ${clause.provenance.citation}:\n` +
            missing.map((m) => `  • "${m}"`).join("\n"),
        ).toEqual([]);
      });

      /*
       * REMOVED: the "will vs last will" and "declare vs hereby declare" variant
       * checks. They guarded hand-chosen template flags, which no longer exist —
       * the clause text is now extracted verbatim from the statute, so a variant
       * cannot be mismatched.
       *
       * They also produced false failures once verbatim extraction landed: a
       * statute often prints TWO forms (simultaneous execution and
       * after-the-fact), and the phrase can appear in the one we do not extract.
       * Oklahoma and North Dakota both trip that. The "every fixed run appears
       * verbatim" check above is the stronger, correct guard.
       */
    });
  }
});
