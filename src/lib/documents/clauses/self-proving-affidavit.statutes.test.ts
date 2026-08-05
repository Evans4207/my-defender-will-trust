import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { selfProvingAffidavitFor, researchedStates } from "./self-proving-affidavit";

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
  const states = researchedStates();

  it("has captured a statute for every researched state", () => {
    const missing = states.filter((s) => loadStatute(s) === null);
    expect(missing, `no capture in docs/statutes for: ${missing.join(", ")}`).toEqual([]);
  });

  for (const state of states) {
    describe(state, () => {
      const statute = loadStatute(state);
      if (!statute) return; // reported by the test above

      it("cites a statute whose text we actually captured", () => {
        const clause = selfProvingAffidavitFor(state, ctx);
        const section = clause.provenance.citation.replace(/^.*§\s*/, "").split("(")[0];
        expect(normalize(statute)).toContain(normalize(section));
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

      it("matches the statute on the will / last will variant", () => {
        const drafted = normalize(
          selfProvingAffidavitFor(state, ctx).paragraphs.join(" "),
        );
        // Compare the testator's operative phrase against the statute's.
        const draftedLastWill = drafted.includes("as my last will");
        const statuteLastWill = statute.includes("as my last will");
        expect(
          draftedLastWill,
          `${state}: draft says "as my ${draftedLastWill ? "last will" : "will"}" but the statute says "as my ${statuteLastWill ? "last will" : "will"}"`,
        ).toBe(statuteLastWill);
      });

      it("matches the statute on the declare / hereby declare variant", () => {
        const drafted = normalize(
          selfProvingAffidavitFor(state, ctx).paragraphs.join(" "),
        );
        const draftedHereby = drafted.includes("do hereby declare");
        const statuteHereby = statute.includes("do hereby declare");
        expect(
          draftedHereby,
          `${state}: draft says "${draftedHereby ? "do hereby declare" : "do declare"}" but the statute says "${statuteHereby ? "do hereby declare" : "do declare"}"`,
        ).toBe(statuteHereby);
      });
    });
  }
});
