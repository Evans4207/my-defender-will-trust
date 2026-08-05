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

**37 of 38 registered sources capture cleanly**, covering 37 jurisdictions. **25 have verbatim clause text generated** (see
`docs/CLAUSE_RESEARCH_METHOD.md`).

Still entirely unregistered — no capture attempted yet: **AL, AR, GA, IN, KY, MS,
NM, TN** (official sites render client-side with no stable per-section URL) and
**LA, MO, NC, OH, TX** (the five states not offered for sale). Coverage is not
complete until those are resolved or consciously scoped out.

### Prescribes a self-proving affidavit form (25 states)

| State | Citation | Captured |
|---|---|---|
| AK | AS § 13.12.504 | 3,897ch |
| AZ | A.R.S. § 14-2504 | 3,776ch |
| CO | C.R.S. § 15-11-504 | 4,580ch |
| DE | 12 Del. C. § 1305 | 2,238ch |
| FL | Fla. Stat. § 732.503 | 2,105ch |
| HI | Haw. Rev. Stat. § 560:2-504 | 3,844ch |
| IA | Iowa Code § 633.279 | 4,694ch |
| ID | Idaho Code § 15-2-504 | 4,020ch |
| KS | K.S.A. § 59-606 | 3,509ch |
| MA | Mass. G.L. c. 190B § 2-504 | 3,283ch |
| ME | 18-C M.R.S. § 2-503 | 5,340ch |
| MI | Mich. Comp. Laws § 700.2504 | 8,848ch |
| MN | Minn. Stat. § 524.2-504 | 4,188ch |
| MT | Mont. Code Ann. § 72-2-524 | 4,356ch |
| ND | N.D. Cent. Code § 30.1-08-04 | 3,910ch |
| NE | Neb. Rev. Stat. § 30-2329 | 4,756ch |
| NV | NRS § 133.050 | 3,859ch |
| OK | 84 O.S. § 55 | 5,963ch |
| PA | 20 Pa.C.S. § 3132.1 | 4,795ch |
| SC | S.C. Code § 62-2-503 | 3,569ch |
| SD | SDCL § 29A-2-504 | 4,875ch |
| UT | Utah Code § 75-2-504 | 4,557ch |
| VA | Va. Code § 64.2-452 | 5,131ch |
| WI | Wis. Stat. § 853.04 | 6,702ch |
| WY | Wyo. Stat. § 2-6-114 | 4,074ch |

### Different model — no prescribed form (10 states)

**The Arizona pattern does not transfer to these.** Each provides for proving a
will by witness affidavit *without* prescribing the affidavit's wording, so they
are `drafted_from_rule`, not `statutory_sample`, and still need counsel's input on
what such an affidavit should say.

| State | Citation | Captured |
|---|---|---|
| CA | Cal. Prob. Code § 8220 | 897ch |
| CT | Conn. Gen. Stat. § 45a-285 | 1,370ch |
| IL | 755 ILCS 5/6-4 | 1,545ch |
| NH | N.H. RSA § 551:2-a | 1,259ch |
| NY | N.Y. SCPA § 1406 | 1,645ch |
| OR | ORS § 113.055 | 1,663ch |
| RI | R.I. Gen. Laws § 33-7-26 | 2,265ch |
| VT | 14 V.S.A. § 108 | 4,160ch |
| WA | RCW § 11.20.020 | 1,879ch |
| WV | W. Va. Code § 41-5-15 | 810ch |

### Captured but NOT usable as a form

| Jurisdiction | Citation | Why |
|---|---|---|
| DC | D.C. Code § 18-908 | This is the Uniform **Electronic** Wills Act. It makes an *electronic* will self-proving and does not reach the paper, wet-signature wills this product generates. Captured so counsel can confirm the District has **no self-proving mechanism for paper wills at all** — which would mean a DC will cannot be self-proved and its witnesses must testify in probate. Deliberately excluded from clause generation. |
| MD | Md. Code, Est. & Trusts § 4-102 | **The same shape as DC.** § 4-102 is the execution provision; the only affidavit forms it prescribes sit inside subsections (c)–(d), which govern **electronic and remotely-witnessed** wills. Maryland appears to have **no self-proving affidavit for an ordinary paper will**. Captured and deliberately excluded from clause generation. **Please confirm.** |

### Blocked (1)

| State | Issue |
|---|---|
| NJ | Official publisher **is** reachable — `lis.njleg.state.nj.us`, "New Jersey Statutes (Unannotated)", current through P.L.2025 c.346. But it is a Folio NXT frameset: content sits in a nested frame, there is no per-section URL, the TOC expands one level per round-trip via JS, the `xhitlist` query endpoint 500s, and the search box ignores programmatic input. Needs a TOC-walking fetch mode or one hand-sourced frame URL. **Do not fall back to the Justia mirror.** |

### Resolved since the last pass (3)

| State | What it turned out to be |
|---|---|
| IL | ILGA was rebuilt; the old `/legislation/ilcs/documents/*.htm` links soft-404. Sections now come an article at a time from `/legislation/ILCS/details` with a `SeqStart`/`SeqEnd` range. **No prescribed form** — 6-4(b) allows proof by affidavit without prescribing wording. |
| MA | The section URL takes no separator: `/Section2-504`. Massachusetts **does** prescribe a UPC-style form; it is now generated. |
| WV | **The earlier "wrong citation" call was itself wrong.** § 41-5-15's *heading* ("Proof of will while testator living") is misleading; its *body* is West Virginia's witness-affidavit provision. See the finding below. |

### How each source is read

| Method | States |
|---|---|
| Plain fetch | most |
| Headless browser (`render: true`) | UT, SD, WA, AK, VT, CT, HI, NY |
| PDF text extraction (`pdf: true`) | CO, IA, ND, OK, WY |

PDF text arrives as positioned glyph runs, not words, so joining it naively yields
"PROBA TE CODE" and "F ormal". Lines are rebuilt from glyph positions: a new line
when the baseline moves, a space only where there is a real horizontal gap.

**Commercial mirrors are not a fallback.** Justia and FindLaw return HTTP 403 to
automated fetches across the board, and Justia additionally sits behind a
Cloudflare bot wall. That is fine: official state publishers are both more
authoritative and safer on licensing, so they are the only source we use.

## Findings worth counsel's attention

**One inherited citation was wrong; a second was wrongly condemned.** ND
§ 30.1-08-03 points at *"Holographic will"* and is corrected here to
**§ 30.1-08-04**. WV § 41-5-15 was previously marked wrong on the strength of its
heading — *"Proof of will while testator living"* — but the heading is misleading
and **the citation is correct** (see below). Both lessons point the same way:
**capture is the first step that actually tests a citation against the published
code, and a heading is not the provision.** Treat the seed's remaining citations as
unverified until captured *and read*.

**West Virginia's affidavit is materially weaker than a self-proving affidavit.**
§ 41-5-15 lets attesting witnesses swear an affidavit before an officer which, if
preserved with the will, carries "the same probative value as if the affiants had
appeared in court". But it prescribes **no form**, and it ends: *"such affidavits
shall not be admissible in evidence in any case in which there is a contest over
the will."* A UPC self-proving affidavit is worth the most precisely when the will
*is* contested, so this does much less work than its counterparts elsewhere.
**Counsel should confirm what, if anything, we should tell a West Virginia customer
about it.**

**Maryland may be a second District-of-Columbia problem.** See the table above:
its only prescribed affidavit forms live in the electronic / remotely-witnessed
subsections. That would make two jurisdictions where a paper will cannot be made
self-proved at all.

**Two distinct statutory models exist** — see the tables above. Assuming every
state follows the Arizona/Florida "prescribed form" pattern would have produced
documents tracking the wrong model in eight states so far.

**Many statutes print two forms** — one for simultaneous execution, one for making
an already-executed will self-proved. We generate the simultaneous-execution form
only. Counsel is asked per state whether the after-the-fact variant should also be
offered.

**The District of Columbia may have no paper-will self-proving mechanism.** The
only provision found is § 18-908, which is the Uniform Electronic Wills Act.
If that reading is right, a DC customer's will cannot be made self-proved and the
execution instructions for DC need to say so. **Please confirm.**

**Statutory forms are being modernised.** Florida's captured form includes
checkboxes for physical presence vs. online notarization. Any state's form may have
been amended since the citation we inherited — which is what the content hash is for.

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

### Two known weaknesses in these gates

**An unbounded capture can still swallow site chrome.** A source with no
`endsBefore` runs to the end of the page. If the section body is long and genuinely
statutory, none of the gates fire — average line length stays prose-like — and the
capture quietly picks up the footer. Both MA and MD did exactly this before they
were bounded, and **VA still does**: its `startsWith: "64.2-452"` matches the page
title, so the capture opens with the site's nav bar and closes with a sign-in form.
The VA *form text* is correct and the verbatim test passes, but the capture is
dirty. **Prefer an `endsBefore` on every source.**

**The drift hash covers chrome, not just statute.** Because the hash is taken over
the whole capture, a purely cosmetic site change registers as "this statute
changed". VA fired exactly this false positive on 2026-08-05: a "Helpful Resources"
footer block disappeared, the hash moved, and the statutory text was byte-identical.
Anyone acting on `statutes:check` must diff before believing an amendment alert.
The fix is to hash only the text between the markers once every source is bounded.

## Adding a state

Add an entry to `SOURCES` in `scripts/harvest-statutes.mjs` with the state, key,
citation, URL, and `startsWith` / `endsBefore` markers, then run the harvester and
**read the captured text** before drafting against it. The gates catch obvious
failures; they do not certify that the capture is the right section.
