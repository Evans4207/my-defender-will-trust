/**
 * Generate docs/STATE_REVIEW_INDEX.md — the per-state landing page for counsel.
 *
 * WHY THIS EXISTS
 * ---------------
 * The legal review checklist tells counsel WHAT to decide. It could not tell them
 * where to look without them hunting through the repo, so reviewing a state meant
 * finding its statute, its capture and its generated clause by hand, 51 times.
 * This produces one table with a live link to each, so a reviewer can open a state
 * and read everything about it in three clicks.
 *
 * WHY IT IS GENERATED RATHER THAN WRITTEN
 * ---------------------------------------
 * The checklist's own file links were hand-pinned to a commit and went 20 commits
 * stale without anything noticing — an attorney clicking them would have reviewed
 * superseded clause text. Anything carrying a commit SHA has to be regenerated,
 * not maintained. Re-run this whenever the research changes:
 *
 *   npm run statutes:index
 *
 * The tier lists are read back OUT of the source files rather than restated here,
 * so this cannot disagree with the code. If the totals stop adding up to every
 * jurisdiction in scope the script fails rather than emitting a quietly wrong
 * index — the same rule applied to the clause generator.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATUTES = join(ROOT, "docs/statutes");
const OUT = join(ROOT, "docs/STATE_REVIEW_INDEX.md");
const REPO = "https://github.com/Evans4207/my-defender-will-trust";

/** Every jurisdiction the product covers. */
const ALL = "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(" ");

const NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin",
  WY: "Wyoming", DC: "District of Columbia",
};

/** Read a set of state codes back out of a source file, so this cannot drift. */
function statesIn(file, marker) {
  const src = readFileSync(join(ROOT, file), "utf8");
  const start = src.indexOf(marker);
  if (start === -1) throw new Error(`marker "${marker}" not found in ${file} — did it get renamed?`);
  // Stop at the end of the object literal: the first line that closes it at
  // column 0-ish. Cheap, but asserted against the total below.
  const body = src.slice(start);
  const end = body.indexOf("\n};");
  if (end === -1) throw new Error(`could not find the end of ${marker} in ${file}`);
  return [...new Set([...body.slice(0, end).matchAll(/^\s{2}"?([A-Z]{2})"?:\s*\{/gm)].map((m) => m[1]))];
}

const verbatim = statesIn("src/lib/documents/clauses/generated/self-proving-forms.ts", "export const SELF_PROVING_FORMS");
const drafted = statesIn("src/lib/documents/clauses/drafted-forms.ts", "export const DRAFTED_FORMS");
const noMech = statesIn("src/lib/documents/clauses/self-proving-affidavit.ts", "const NO_KNOWN_MECHANISM");

/** Jurisdictions with no clause of any kind, and why. */
const OPEN = {
  AR: "Official code published only via a LexisNexis site that serves a CAPTCHA to automated requests. **Please supply the form text** from a subscription database.",
  GA: "As AR. Citation verified as O.C.G.A. § 53-4-24 (\"Self-proved will or codicil\") via the official tool's own search results, but the body could not be captured. **Please supply the form text.**",
  MS: "As AR. **Please supply the form text.**",
  TN: "As AR. **Please supply the form text.**",
  NJ: "The official publisher (lis.njleg.state.nj.us) stopped responding on 7 Aug 2026 — it accepts a connection then returns nothing, from both a script and a real browser, while the rest of njleg.state.nj.us serves normally. Expected to return; no action needed from you.",
  LA: "Out of scope by owner decision. Louisiana's civil-law execution formalities (authentic act, notary plus two witnesses) do not fit this pipeline and need their own treatment.",
};

const TIER = {
  verbatim: {
    label: "Reproduced verbatim",
    blurb:
      "The state prescribes a form and we reproduce it **word for word** from the state's own published statute. " +
      "A test fails the build if our text ever drifts from the captured source. " +
      "**What we need from you:** confirm the statute is still current, and that we took the right excerpt from it.",
  },
  drafted: {
    label: "Drafted by us",
    blurb:
      "The statute allows a self-proving affidavit but **never says what it should say**, so the wording below is **ours, not the legislature's** — written by a non-lawyer and not authoritative. " +
      "We record the elements the statute requires and test that the draft covers each, which proves coverage but **not** sufficiency. " +
      "**What we need from you:** correct the wording, and answer the questions listed against each state.",
  },
  noMech: {
    label: "No mechanism found",
    blurb:
      "We could find **no self-proving procedure for an ordinary paper will** in this jurisdiction, so we have deliberately drafted nothing — writing an affidavit here would invent a procedure the legislature did not create. " +
      "**What we need from you:** tell us whether that reading is right, and what these documents should carry instead.",
  },
  open: {
    label: "Not captured",
    blurb: "No statutory text obtained. Reason and required action given per state.",
  },
};

/**
 * Where a HUMAN should be sent, when that differs from where the harvester fetched.
 *
 * The capture's `sourceUrl` is chosen for machine retrieval and is sometimes
 * useless to a reader — Alabama's is a GraphQL endpoint, which would have handed
 * counsel an API error instead of a statute. Overrides go here rather than in the
 * capture, because the capture must keep recording what we actually fetched.
 */
const READER_URL = {
  // The GraphQL endpoint the harvester queries is not a page. This deep link into
  // the code browser does load § 43-8-132 (verified in a browser), even though the
  // site is a single-page app that rewrites the address bar back to its root.
  AL: "https://alison.legislature.state.al.us/code-of-alabama?section=43-8-132",
};

/** Warnings for links that work but do not land the reader ON the section. */
const LINK_NOTE = {
  AL: "single-page app — opens on the section, but the address bar resets to the site root",
  IN: "opens the whole of Title 29 — search within the page for **IC 29-1-5-3.1**",
  NM: "opens Chapter 45 as one PDF — search within it for **45-2-504**",
  KY: "opens the section as a PDF",
  CO: "opens Title 15 as one PDF — search within it for **15-11-504**",
  AK: "opens the statutes browser — search for **13.12.504**",
};

function capture(state) {
  const p = join(STATUTES, `${state}_self_proving_affidavit.json`);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
}

/**
 * Which revision the code links point at.
 *
 * DEFAULT: `main`, so a link can never show counsel superseded text. That failure
 * is not hypothetical — the checklist's own links were hand-pinned to a commit and
 * sat 20 commits stale, which would have had an attorney reviewing the Virginia
 * clause we corrected on 7 Aug 2026.
 *
 * `--pin` freezes the links at the current commit instead. Use that only when
 * FREEZING A PACKET TO SEND, once the research is complete: pinning is what keeps
 * a reviewer's line-level notes valid, but it is only safe when the text has
 * stopped moving. While the work is live, track main.
 */
const PIN = process.argv.includes("--pin");
const sha = execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
const ref = PIN ? sha : "main";
const blob = (path) => `${REPO}/blob/${ref}/${path}`;

// Every jurisdiction must land in exactly one tier. This is the guard that stops
// a regex change from silently dropping states out of the packet.
const assigned = [...verbatim, ...drafted, ...noMech, ...Object.keys(OPEN)];
const dupes = assigned.filter((s, i) => assigned.indexOf(s) !== i);
const missing = ALL.filter((s) => !assigned.includes(s));
const stray = assigned.filter((s) => !ALL.includes(s));
if (dupes.length || missing.length || stray.length) {
  console.error("Refusing to write an index that does not account for every jurisdiction:");
  if (dupes.length) console.error(`  in more than one tier: ${dupes.join(", ")}`);
  if (missing.length) console.error(`  in no tier at all:    ${missing.join(", ")}`);
  if (stray.length) console.error(`  not a jurisdiction:   ${stray.join(", ")}`);
  process.exit(1);
}

const rows = (states, tier) =>
  states
    .sort((a, b) => NAMES[a].localeCompare(NAMES[b]))
    .map((s) => {
      const c = capture(s);
      const href = READER_URL[s] ?? c?.sourceUrl;
      const statute = c
        ? `[${c.citation}](${href})${LINK_NOTE[s] ? `<br/><sub>${LINK_NOTE[s]}</sub>` : ""}`
        : "—";
      const read = c ? c.retrievedAt : "—";
      const src = c ? `[capture](${blob(`docs/statutes/${s}_self_proving_affidavit.json`)})` : "—";
      const text =
        tier === "verbatim"
          ? `[our text](${blob("src/lib/documents/clauses/generated/self-proving-forms.ts")})`
          : tier === "drafted"
            ? `[our draft](${blob("src/lib/documents/clauses/drafted-forms.ts")})`
            : tier === "noMech"
              ? `[finding](${blob("src/lib/documents/clauses/self-proving-affidavit.ts")})`
              : "—";
      const note = tier === "open" ? OPEN[s] : "";
      return tier === "open"
        ? `| **${NAMES[s]}** (${s}) | ${note} |`
        : `| **${NAMES[s]}** (${s}) | ${statute} | ${read} | ${src} | ${text} |`;
    })
    .join("\n");

const section = (tier, states) => {
  const t = TIER[tier];
  if (tier === "open") {
    return `## ${t.label} — ${states.length} jurisdictions\n\n${t.blurb}\n\n| Jurisdiction | Why, and what we need |\n|---|---|\n${rows(states, tier)}\n`;
  }
  return `## ${t.label} — ${states.length} jurisdictions\n\n${t.blurb}\n\n| Jurisdiction | Statute (opens the state's own site) | Read on | Captured text | Our text |\n|---|---|---|---|---|\n${rows(states, tier)}\n`;
};

const md = `# State-by-state review index

**Companion to \`LEGAL_REVIEW_CHECKLIST.docx\`.** The checklist says what needs
deciding; this says where to look. Every citation below is a **live link to that
state's own official publisher** — click it to read the statute at source.

*Generated from the captures by \`scripts/gen-state-review-index.mjs\`; do not edit
by hand.* ${
  PIN
    ? `*Code links are **pinned to commit [\`${sha}\`](${REPO}/tree/${sha})**, so your notes stay valid even if the code moves.*`
    : `*Code links track **\`main\`**, so they always show the current text — which means the code may change under you while you review. Ask for a pinned copy if you want a frozen snapshot to annotate.*`
}

---

## How to read this

We are a product team, not lawyers, and none of this has been legally reviewed.
For each jurisdiction we say plainly which of four situations it is in — and the
four are **not** the same amount of work for you:

| Situation | Jurisdictions | What we are asking |
|---|---|---|
| [Reproduced verbatim](#reproduced-verbatim--${verbatim.length}-jurisdictions) | ${verbatim.length} | Confirm it is current and correctly excerpted |
| [Drafted by us](#drafted-by-us--${drafted.length}-jurisdictions) | ${drafted.length} | Correct our wording |
| [No mechanism found](#no-mechanism-found--${noMech.length}-jurisdictions) | ${noMech.length} | Tell us if we are right, and what to do instead |
| [Not captured](#not-captured--${Object.keys(OPEN).length}-jurisdictions) | ${Object.keys(OPEN).length} | Supply text we cannot reach, or nothing |

**"Read on" is the date we retrieved that statute.** It is not a currency
guarantee — a statute may have been amended since, and confirming that is one of
the things we are asking you to check.

---

${section("verbatim", verbatim)}
---

${section("drafted", drafted)}
### Three of the drafted states carry limits worth reading first

- **Vermont** — § 108 requires the sworn acknowledgment of the **testator as well
  as the witnesses**, unlike every other state here. A witnesses-only affidavit
  would not track the statute.
- **West Virginia** — a § 41-5-15 affidavit is **inadmissible in any contested
  case**, so it fails exactly when it would matter most. Should these documents
  carry one at all, and what should the customer be told?
- **California** — the weakest fit. Prob. Code § 8220 is a rule of **evidence at
  probate**, not a self-proving mechanism; California has no procedure of the
  Uniform Probate Code kind. Our draft leans on § 8220(b)'s reference to "an
  affidavit in the original will that includes or incorporates the attestation
  clause". The threshold question is whether California documents should carry an
  affidavit at all, or only a strong attestation clause with form DE-131 handled
  at probate.

---

${section("noMech", noMech)}
---

${section("open", Object.keys(OPEN))}
---

## Two corrections we found ourselves, and are disclosing

Both were extraction faults on our side, fixed on 7 August 2026. Neither was
caught by our tests, because in each case the text really did appear in the source
statute — it simply was not the prescribed form.

- **Idaho** was taking the *after-the-fact* form plus a line of statutory
  preamble, as though it were text for the signer.
- **Virginia, Kansas and Delaware** were running past the end of the form.
  Virginia's affidavit was carrying operative statute, the amendment history and
  four paragraphs of the Virginia Law **website** (including a "Privacy Policy ©
  Copyright Commonwealth of Virginia" line); Kansas was carrying two paragraphs
  addressed to the court rather than the signer; Delaware a session-law citation.

**Any document generated for those states before 7 August 2026 carries the old
text.** All four now end at the officer's capacity line.
`;

writeFileSync(OUT, md);
console.log(`wrote ${OUT}`);
console.log(
  `  verbatim ${verbatim.length} · drafted ${drafted.length} · no-mechanism ${noMech.length} · open ${Object.keys(OPEN).length} = ${ALL.length}`,
);
console.log(
  PIN ? `  code links PINNED to ${sha}` : `  code links track main (use --pin to freeze a packet)`,
);
