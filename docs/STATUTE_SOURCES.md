# Statute sources — capture status

Verbatim statutory text captured from each state's own official publisher, with a
citation, source URL, retrieval date and content hash. Captures live in
`docs/statutes/<STATE>_<key>.json` and are produced by `scripts/harvest-statutes.mjs`.

```bash
npm run statutes:harvest      # fetch / refresh all registered sources
npm run statutes:check        # re-fetch and report drift only (no writes)
```

**This is source material, not approved text.** A capture is the statute as
published — the raw input a clause is drafted against. It is not legal advice, not
verified by counsel, and it does not make anything compliant. See
`docs/CLAUSE_RESEARCH_METHOD.md`.

## Why we read the state's own site

Statutory text is not copyrightable (government edicts doctrine), and every state
publishes its code free. The state's own publisher is therefore both the most
authoritative source and the one we may safely reproduce in the product. We take
**statutory text only** — never a commercial publisher's annotations, headnotes or
editorial apparatus, which are copyrighted and licensed.

This is why a paid research subscription is not required to obtain form text. What
a paid service would add is amendment alerting and case-law annotation. We get a
crude version of the first for free: each capture stores a content hash, so
`npm run statutes:check` reports "this statute changed since we drafted against it."

## Current status — self-proving affidavit

| State | Citation | Status | Notes |
|---|---|---|---|
| AZ | A.R.S. § 14-2504 | ✅ captured | Sample form, substantial compliance. Clause drafted — see `clauses/self-proving-affidavit.ts` |
| FL | Fla. Stat. § 732.503 | ✅ captured | Prescribed form captured in full, including the physical-presence / online-notarization checkboxes |
| MT | Mont. Code Ann. § 72-2-524 | ✅ captured | Not yet drafted |
| NV | NRS § 133.050 | ✅ captured | Declaration **or** affidavit variants; not yet drafted |
| OR | ORS § 113.055 | ⚠️ captured, flagged | See finding below |
| UT | Utah Code § 75-2-504 | ⛔ blocked | Text rendered client-side. A PDF edition exists and needs a PDF extractor |
| SD | SDCL § 29A-2-504 | ⛔ blocked | Single-page app; server returns a JS shell for the page and the API path |
| WA | RCW § 11.20.020 | ⛔ blocked | Section body rendered client-side |

Blocked states are deliberately kept in the registry. A state we cannot capture is
a **visible gap**, not one quietly dropped from the list.

## Findings worth counsel's attention

**Oregon may not prescribe a form at all.** ORS 113.055 is headed *"Testimony of
attesting witnesses to will"* and provides that an attesting witness's affidavit
may be used **instead of the witness appearing in court**. It does not appear to
prescribe a form on a "substantially the following form" basis the way Arizona and
Florida do. If that reading is right, Oregon is `drafted_from_rule` rather than
`statutory_sample`, and the drafting approach differs accordingly. **Flagged for
counsel — do not assume the Arizona pattern transfers.**

**Statutory forms are being modernised.** Florida's captured form includes
checkboxes for physical presence vs. online notarization. Any state's form may
have been amended more recently than the citation we inherited, which is exactly
what the content hash is for.

## Quality gates in the harvester

Each capture must survive all of these, or it is refused rather than written:

- **Charset-aware decoding** — several legislature sites serve windows-1252;
  decoding as UTF-8 corrupts section symbols and typographic punctuation.
- **Numeric entity decoding** — form blanks are built from `&#xA0;` / `&#x2003;`;
  leaving them raw corrupts the captured form.
- **Cross-reference rejection** — a hit followed by `;` or `,` is a mention inside
  some *other* section, not the section body.
- **Bounded-section preference** — a candidate whose end marker matched is a
  precisely delimited section; an unbounded one usually ran into the site footer.
- **Boilerplate / navigation detection** — a capture that is mostly short,
  link-shaped lines is site chrome, not statute, and is rejected.
- **Content smoke test** — the text must show the hallmarks of the statute type
  (sworn/affidavit, witnesses, prescribed form). Missing two or more is refused;
  missing one is recorded in `warnings` for a human to clear.

These caught three real defects during the first run: an amendment-history stub
captured instead of a section body, undecoded entities corrupting a form, and a
page of site navigation captured as if it were statute.

## Adding a state

Add an entry to `SOURCES` in `scripts/harvest-statutes.mjs` with the state, key,
citation, URL, and `startsWith` / `endsBefore` markers, then run the harvester and
**read the captured text** before drafting against it. The gates catch obvious
failures; they do not certify that the capture is the right section.
