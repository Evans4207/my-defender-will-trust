#!/usr/bin/env node
/**
 * Generate the self-proving affidavit clause text VERBATIM from the captured
 * statutes in docs/statutes.
 *
 * WHY GENERATE INSTEAD OF TEMPLATE
 * --------------------------------
 * The first pass hand-drafted these with per-state "variant" flags — "as my will"
 * vs "as my last will", "do declare" vs "do hereby declare", and so on. Each new
 * state added another flag, and the cross-check test kept finding more:
 * "therein expressed" vs "expressed in it", parenthetical vs comma alternates,
 * South Carolina's under-eighteen-if-married clause, Maine's emancipated-minor
 * clause. Templating was fighting the data.
 *
 * Reproducing the statute's own words is both simpler and legally stronger: for a
 * prescribed form, the compliant text IS the statute's text. So this script slices
 * the form out of each captured statute and emits it as data. Wording differences
 * between states stop being something we model — they are simply carried through.
 *
 * The only substitution is the testator's name into the form's first blank.
 * Everything else keeps the statute's own blanks, which is what the testator,
 * witnesses and notary fill in at signing.
 *
 *   node scripts/gen-self-proving-forms.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATUTES = join(ROOT, "docs/statutes");
const OUT = join(ROOT, "src/lib/documents/clauses/generated/self-proving-forms.ts");

/**
 * Where each state's prescribed form begins and ends inside its statute.
 *
 * `from` is matched after the statute's "in substantially the following form"
 * style preamble; `to` bounds the form so trailing subsections, history notes and
 * cross-references are excluded.
 */
const EXTRACT = {
  // Most states open the form with the testator's declaration. Note "I," with no
  // following space: several statutes wrap immediately after the comma.
  AZ: { from: "I,", to: "B. An attested will may be made self-proved" },
  ID: { from: "I,", to: "(3)" },
  MN: { from: "I,", to: "(b)" },
  MT: { from: "I,", to: "(2)" },
  NE: { from: "I,", to: "(2) An attested will may at any time" },
  SC: { from: "I,", to: "(b)" },
  SD: { from: "I,", to: "(b)" },
  UT: { from: "I,", to: "(2)" },
  ME: { from: "I,", to: "2." },
  MI: { from: "I,", to: "(2)" },
  WI: { from: "I,", to: "Two-step procedure" },
  // These open with the officer's venue block rather than the testator line.
  FL: { from: "STATE OF", to: "(2)" },
  DE: { from: "STATE OF", to: "(b)" },
  KS: { from: "State of", to: "History:" },
  NV: { from: "State of Nevada", to: "NRS 133.055" },
  VA: { from: "STATE OF VIRGINIA", to: "B." },
  PA: { from: "I,", to: "(b)" },
  AK: { from: "I,", to: "(b)" },
  CO: { from: "I,", to: "(2)" },
  WY: { from: "I,", to: "(b)" },
  OK: { from: "STATE OF", to: "b. the written declaration" },
  IA: { from: "Affidavit", to: "3." },
  ND: { from: "I,", to: "2." },
  HI: { from: "I,", to: "(b)" },
};

/**
 * Collapse the many blank styles statutes use into one readable run.
 *
 * Some publishers render a fill-in blank as a run of non-breaking spaces rather
 * than underscores or dots. Those survive the harvester as ordinary spaces, so a
 * blank can arrive as nothing at all ("I, , declare..."). Restore those, or the
 * form loses the space the signer is meant to write in.
 */
function normalizeBlanks(s) {
  return s
    .replace(/[_.…]{3,}/g, "____________")
    // An elided blank between punctuation, e.g. "I, , declare" or "by , the".
    .replace(/([,(])\s{1,}([,).])/g, "$1 ____________$2")
    .replace(/\b(by|I,|We,)\s{2,}(?=[a-z,])/g, "$1 ____________ ")
    // "We, and ," — two elided blanks either side of a conjunction.
    .replace(/(\bWe,)\s+and\s+,/g, "$1 ____________ and ____________,")
    .replace(/\band\s+,/g, "and ____________,")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractForm(text, { from, to }) {
  // Start at the form itself, which follows the "...following form:" preamble.
  // Whitespace-tolerant: PDFs wrap mid-phrase, e.g. "as\nfollows:".
  const preamble = /(?:following\s+form|as\s+follows|same\s+intent)\s*:?/i.exec(text);
  const searchFrom = preamble ? preamble.index + preamble[0].length : 0;

  const start = text.indexOf(from, searchFrom);
  if (start === -1) return { form: null, reason: `start "${from}" not found` };

  let end = to ? text.indexOf(to, start + 1) : -1;
  if (end === -1) end = text.length;

  const form = normalizeBlanks(text.slice(start, end));
  if (form.length < 200) return { form: null, reason: `only ${form.length} chars` };
  return { form, reason: null };
}

/**
 * Split the extracted form into its paragraphs, dropping signature-line stubs.
 *
 * Several statutes are published hard-wrapped, so a single sentence arrives as
 * half a dozen lines. Rejoin any line that does not end a sentence with the line
 * after it, otherwise one paragraph fragments into many and the form reads as
 * gibberish.
 */
function toParagraphs(form) {
  const lines = form
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Bare signature labels sit on their own line and must not be glued onto the
  // sentence above them, or the body reads "...as my will. Testator We, ...".
  const isLabel = (l) =>
    /^[\s(]*(testator|witness(es)?|seal|signed|official capacity)[\s):,._-]*$/i.test(l);

  const joined = [];
  for (const line of lines) {
    const prev = joined[joined.length - 1];
    const prevIsOpen = prev && !/[.:;]$/.test(prev) && !isLabel(prev);
    if (prevIsOpen && !isLabel(line)) joined[joined.length - 1] = `${prev} ${line}`;
    else joined.push(line);
  }

  return (
    joined
      // Drop bare label lines ("Testator", "Witness", "(Seal)") — those become
      // signature lines, not body paragraphs.
      .filter((l) => !isLabel(l))
      // PDF running heads/feet leak into the text stream ("... Page 15").
      .filter((l) => !/\bPage\s+\d+\s*$/i.test(l))
      .filter((l) => l.replace(/[_\s.]/g, "").length > 25)
  );
}

const rows = [];
const skipped = [];
for (const [state, markers] of Object.entries(EXTRACT)) {
  const p = join(STATUTES, `${state}_self_proving_affidavit.json`);
  if (!existsSync(p)) {
    skipped.push(`${state}: no capture`);
    continue;
  }
  const cap = JSON.parse(readFileSync(p, "utf8"));
  const { form, reason } = extractForm(cap.text, markers);
  if (!form) {
    skipped.push(`${state}: ${reason}`);
    continue;
  }
  const paragraphs = toParagraphs(form);
  if (!paragraphs.length) {
    skipped.push(`${state}: no paragraphs after filtering`);
    continue;
  }
  // Overcapture guard. Length is the reliable signal: some states (Wisconsin)
  // legitimately present the form as a numbered list of short declarations, so a
  // high paragraph count alone is not evidence of a bad extraction.
  if (form.length > 3500) {
    skipped.push(`${state}: ${form.length} chars — likely overcaptured, tighten "to"`);
    continue;
  }
  rows.push({
    state,
    citation: cap.citation,
    sourceUrl: cap.sourceUrl,
    retrievedAt: cap.retrievedAt,
    paragraphs,
  });
  console.log(`${state}  ${paragraphs.length} paragraph(s), ${form.length} chars`);
}

const banner = `// GENERATED FILE — DO NOT EDIT BY HAND.
// Produced by scripts/gen-self-proving-forms.mjs from the captured statutes in
// docs/statutes. The text below is the state's own prescribed form, reproduced
// verbatim (blank runs normalized). Re-run the generator after re-harvesting.
//
// Statutory text is not copyrightable (government edicts doctrine).
`;

const body = `${banner}
export type StatutoryForm = {
  citation: string;
  sourceUrl: string;
  retrievedAt: string;
  /** The prescribed form's paragraphs, verbatim from the statute. */
  paragraphs: string[];
};

export const SELF_PROVING_FORMS: Record<string, StatutoryForm> = ${JSON.stringify(
  Object.fromEntries(
    rows.map((r) => [
      r.state,
      {
        citation: r.citation,
        sourceUrl: r.sourceUrl,
        retrievedAt: r.retrievedAt,
        paragraphs: r.paragraphs,
      },
    ]),
  ),
  null,
  2,
)};
`;

writeFileSync(OUT, body);
console.log(`\nwrote ${OUT}`);
console.log(`${rows.length} state(s) generated`);
if (skipped.length) {
  console.log(`\n${skipped.length} skipped (fix markers in EXTRACT):`);
  for (const s of skipped) console.log(`  ${s}`);
}
