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

**33 of 37 registered sources capture cleanly**, covering 33 jurisdictions. **24 have verbatim clause text generated** (see
`docs/CLAUSE_RESEARCH_METHOD.md`).

### Prescribes a self-proving affidavit form (24 states)

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

### Different model — no prescribed form (8 states)

**The Arizona pattern does not transfer to these.** Each provides for proving a
will by witness affidavit *without* prescribing the affidavit's wording, so they
are `drafted_from_rule`, not `statutory_sample`, and still need counsel's input on
what such an affidavit should say.

| State | Citation | Captured |
|---|---|---|
| CA | Cal. Prob. Code § 8220 | 897ch |
| CT | Conn. Gen. Stat. § 45a-285 | 1,370ch |
| NH | N.H. RSA § 551:2-a | 1,259ch |
| NY | N.Y. SCPA § 1406 | 1,645ch |
| OR | ORS § 113.055 | 1,663ch |
| RI | R.I. Gen. Laws § 33-7-26 | 2,265ch |
| VT | 14 V.S.A. § 108 | 4,160ch |
| WA | RCW § 11.20.020 | 1,879ch |

### Captured but NOT usable as a form

| Jurisdiction | Citation | Why |
|---|---|---|
| DC | D.C. Code § 18-908 | This is the Uniform **Electronic** Wills Act. It makes an *electronic* will self-proving and does not reach the paper, wet-signature wills this product generates. Captured so counsel can confirm the District has **no self-proving mechanism for paper wills at all** — which would mean a DC will cannot be self-proved and its witnesses must testify in probate. Deliberately excluded from clause generation. |

### Blocked (4)

| State | Issue |
|---|---|
| WV | **Inherited citation is wrong.** § 41-5-15 is *"Proof of will while testator living"*. The actual provision must be identified. |
| IL | Every ILGA URL tried returns a soft 404 (HTTP 404 with a full page body). |
| MA | Chapter page is a TOC only; every section-level URL returns 404. |
| NJ | No official publisher reachable — the legislature's own pages return empty shells, and the commercial mirror sits behind a Cloudflare bot wall. Needs a hand-sourced capture. |

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

**Two inherited citations were wrong.** WV § 41-5-15 points at *"Proof of will
while testator living"*; ND § 30.1-08-03 points at *"Holographic will"* (corrected
here to **§ 30.1-08-04**). Both came from earlier desk research in
`supabase/seed.sql`. **Capture is the first step that actually tests a citation
against the published code** — treat the seed's remaining citations as unverified.

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

## Adding a state

Add an entry to `SOURCES` in `scripts/harvest-statutes.mjs` with the state, key,
citation, URL, and `startsWith` / `endsBefore` markers, then run the harvester and
**read the captured text** before drafting against it. The gates catch obvious
failures; they do not certify that the capture is the right section.
