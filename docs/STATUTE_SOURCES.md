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

**25 of 28 registered sources capture cleanly.** 46 states are available for
launch, so this is a bit over half.

### Prescribes a self-proving affidavit form (18 states)

Clause text for these is generated verbatim from the capture — see
`docs/CLAUSE_RESEARCH_METHOD.md`.

| State | Citation | Captured |
|---|---|---|
| AK | AS § 13.12.504 | 3,897ch |
| AZ | A.R.S. § 14-2504 | 3,776ch |
| DE | 12 Del. C. § 1305 | 2,238ch |
| FL | Fla. Stat. § 732.503 | 2,105ch |
| ID | Idaho Code § 15-2-504 | 4,020ch |
| KS | K.S.A. § 59-606 | 3,509ch |
| ME | 18-C M.R.S. § 2-503 | 5,340ch |
| MI | Mich. Comp. Laws § 700.2504 | 8,848ch |
| MN | Minn. Stat. § 524.2-504 | 4,188ch |
| MT | Mont. Code Ann. § 72-2-524 | 4,356ch |
| NE | Neb. Rev. Stat. § 30-2329 | 4,756ch |
| NV | NRS § 133.050 | 3,859ch |
| PA | 20 Pa.C.S. § 3132.1 | 4,795ch |
| SC | S.C. Code § 62-2-503 | 3,569ch |
| SD | SDCL § 29A-2-504 | 4,875ch |
| UT | Utah Code § 75-2-504 | 4,557ch |
| VA | Va. Code § 64.2-452 | 5,131ch |
| WI | Wis. Stat. § 853.04 | 6,702ch |

### Different model — no prescribed form (7 states)

**The Arizona pattern does not transfer to these.** Each provides for proving a
will by witness affidavit *without* prescribing the affidavit's wording, so they
are `drafted_from_rule`, not `statutory_sample`, and still need counsel's input on
what such an affidavit should say.

| State | Citation | Captured |
|---|---|---|
| CA | Cal. Prob. Code § 8220 | 897ch |
| CT | Conn. Gen. Stat. § 45a-285 | 1,370ch |
| NH | N.H. RSA § 551:2-a | 1,259ch |
| OR | ORS § 113.055 | 1,663ch |
| RI | R.I. Gen. Laws § 33-7-26 | 2,265ch |
| VT | 14 V.S.A. § 108 | 4,160ch |
| WA | RCW § 11.20.020 | 1,879ch |

### Blocked (3)

| State | Issue |
|---|---|
| WV | **Inherited citation is wrong.** § 41-5-15 is *"Proof of will while testator living"*. West Virginia's actual provision must be identified. |
| ND | **Inherited citation was wrong** — corrected here from § 30.1-08-03 (*Holographic will*) to **§ 30.1-08-04** (*Self-proved will*). The chapter page is a table of contents only; the text is PDF, so capture needs a PDF extractor. |
| IL | Every ILGA URL tried returns a soft 404 (HTTP 404 with a full page body). Needs the current ilga.gov deep-link format. |

Six sources (UT, SD, WA, AK, VT, CT) render their statute client-side and are
captured with a headless browser (`render: true`). Chrome launches lazily and is
shared, so runs with no JS-gated sources pay nothing for it.

## Findings worth counsel's attention

**Two inherited citations were wrong.** WV § 41-5-15 points at "Proof of will
while testator living"; ND § 30.1-08-03 points at "Holographic will". Both came
from earlier desk research in `supabase/seed.sql`. **Capture is the first step
that actually tests a citation against the published code** — expect more of these
as coverage grows, and treat the seed's remaining citations as unverified.

**Two distinct statutory models exist** — see the tables above. Assuming every
state follows the Arizona/Florida "prescribed form" pattern would have produced
documents tracking the wrong model in seven states so far.

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
