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

**45 of 46 registered sources capture cleanly**, covering 45 jurisdictions. **32 have verbatim clause text generated** (see
`docs/CLAUSE_RESEARCH_METHOD.md`).

**Target is 50 jurisdictions** — 50 states + DC, less Louisiana (owner decision,
2026-08-05: LA's civil-law will formalities need their own treatment rather than
being forced through this pipeline). MO/NC/OH/TX are researched even though they
are not currently offered for sale, so switching a state on later is a config
change rather than a fresh research project.

Nothing is unregistered any more. **5 jurisdictions short of the target**, and the
remainder split into two groups with very different prospects (2026-08-07):

- **AR, GA, MS, TN — blocked on a CAPTCHA, and not solvable by more engineering.**
  All four publish their official code *only* through a LexisNexis public-access
  site under contract with the state (`lexisnexis.com/hottopics/{arcode,gacode,
  mscode,tncode}`, all of which land on `advance.lexis.com`). The table of
  contents is session-scoped (`/r/tocprovider/<session>/toc/<session>`), so there
  is no stable per-section URL; and requesting the document page directly returns
  a **CAPTCHA validation page**. Defeating that is out of bounds, so no fetch
  mode — plain, rendered, or otherwise — will reach these. They need either a
  hand-sourced capture or counsel to supply the form. See "Findings worth
  counsel's attention".
- **NJ — blocked today by an unresponsive server, not by design.** See "Blocked".

Citations verified along the way even where the text could not be captured:
**O.C.G.A. § 53-4-24 is "Self-proved will or codicil"** — confirmed against the
official Georgia Code Research Tool's own search results, so the seed citation is
right even though the section body is behind the CAPTCHA.

### Prescribes a self-proving affidavit form (32 states)

| State | Citation | Captured |
|---|---|---|
| AK | AS § 13.12.504 | 3,897ch |
| AL | Ala. Code § 43-8-132 | 3,918ch |
| AZ | A.R.S. § 14-2504 | 3,776ch |
| CO | C.R.S. § 15-11-504 | 4,580ch |
| DE | 12 Del. C. § 1305 | 2,238ch |
| FL | Fla. Stat. § 732.503 | 2,105ch |
| HI | Haw. Rev. Stat. § 560:2-504 | 3,844ch |
| IA | Iowa Code § 633.279 | 4,694ch |
| ID | Idaho Code § 15-2-504 | 4,020ch |
| IN | Ind. Code § 29-1-5-3.1 | 5,204ch |
| KS | K.S.A. § 59-606 | 3,509ch |
| KY | KRS § 394.225 | 4,648ch |
| MA | Mass. G.L. c. 190B § 2-504 | 3,283ch |
| ME | 18-C M.R.S. § 2-503 | 5,340ch |
| MI | Mich. Comp. Laws § 700.2504 | 8,848ch |
| MN | Minn. Stat. § 524.2-504 | 4,188ch |
| MO | Mo. Rev. Stat. § 474.337 | 2,173ch |
| MT | Mont. Code Ann. § 72-2-524 | 4,356ch |
| NC | N.C.G.S. § 31-11.6 | 4,675ch |
| ND | N.D. Cent. Code § 30.1-08-04 | 3,910ch |
| NE | Neb. Rev. Stat. § 30-2329 | 4,756ch |
| NM | NMSA 1978, § 45-2-504 | 6,000ch |
| NV | NRS § 133.050 | 3,859ch |
| OK | 84 O.S. § 55 | 5,963ch |
| PA | 20 Pa.C.S. § 3132.1 | 4,795ch |
| SC | S.C. Code § 62-2-503 | 3,569ch |
| SD | SDCL § 29A-2-504 | 4,875ch |
| TX | Tex. Est. Code § 251.1045 | 2,475ch |
| UT | Utah Code § 75-2-504 | 4,557ch |
| VA | Va. Code § 64.2-452 | 5,131ch |
| WI | Wis. Stat. § 853.04 | 6,702ch |
| WY | Wyo. Stat. § 2-6-114 | 4,074ch |

### Different model — no prescribed form (8 states)

**The Arizona pattern does not transfer to these.** Each provides for proving a
will by witness affidavit *without* prescribing the affidavit's wording, so they
are `drafted_from_rule`, not `statutory_sample`.

Since 2026-08-07 each of these carries a DRAFTED affidavit rather than the generic
placeholder — see `src/lib/documents/clauses/drafted-forms.ts`. The text is ours,
not the legislature's, and is flagged `[ATTORNEY REVIEW REQUIRED]`; the point is to
give counsel something to redline instead of a blank page. Because there is no
source text to match, the verbatim test cannot apply — `drafted-forms.test.ts`
instead records the ELEMENTS each statute requires, with the subsection they come
from, and asserts the draft covers every one. **That proves coverage, not
sufficiency.**

They split into two families, which matters for how much weight the draft carries:

- **Enumerated-element (IL, VT, and NY in substance).** The statute lists exactly
  what must be established, so drafting is close to mechanical. Vermont is really a
  self-proving statute that omitted to print a form — note it requires the sworn
  acknowledgment of the **testator as well as the witnesses**, unlike every other
  state here.
- **Testify-standard (CT, WA, WV, OR, CA).** The statute defines content by
  reference — "such facts as they would be required to testify to in court to prove
  such will" — so the draft tracks the elements of due execution. Weaker footing.

| State | Citation | Captured | Note |
|---|---|---|---|
| CA | Cal. Prob. Code § 8220 | 897ch | Weakest fit — see below |
| CT | Conn. Gen. Stat. § 45a-285 | 1,370ch | Affidavit must be written ON the will or attached |
| IL | 755 ILCS 5/6-4 | 1,545ch | 6-4(a) enumerates 3 elements; 6-4(b)(3) blesses the instrument |
| NY | N.Y. SCPA § 1406 | 1,388ch | Names competence + absence of restraint expressly |
| OR | ORS § 113.055 | 1,663ch | Ex parte only; contestable within 30 days |
| VT | 14 V.S.A. § 108 | 927ch | Testator must swear too |
| WA | RCW § 11.20.020 | 1,879ch | |
| WV | W. Va. Code § 41-5-15 | 810ch | **Inadmissible if the will is contested** |

**California is the weakest of the eight and counsel should be told so plainly.**
§ 8220 is a rule of evidence applied at probate, not a self-proving mechanism —
California has no self-proving procedure of the UPC kind. The draft leans on
§ 8220(b)'s reference to "an affidavit in the original will that includes or
incorporates the attestation clause". Whether that carries the intended effect
when executed contemporaneously is a legal judgment we cannot make, and the
threshold question — whether California documents should carry an affidavit at
all, or only a strong attestation clause with form DE-131 handled at probate — is
put to counsel directly.

### NH and RI were misclassified — both DO prescribe a form (corrected 2026-08-07)

Both sat in the list above as "no prescribed form". Reading the captured **body**
rather than the section heading shows otherwise, and both now generate verbatim:

- **NH RSA 551:2-a(I)** — "the signatures of the testator and witnesses **shall be
  followed by** a sworn acknowledgment ... **as follows:**", then prints the
  acknowledgment with its four numbered oath items. Note "shall ... as follows"
  reads **mandatory**, which is a stronger standard than the "substantially the
  following form" language most states use. Flagged for counsel.
- **RI § 33-7-26(3)** — "An affidavit **substantially in the form that follows**
  shall be deemed to meet the requirements of subdivision (2)": an express safe
  harbour. Its preamble uses neither "following form" nor "as follows", so the
  generator's shared preamble regex does not fire on it.

This is the *Arizona/West Virginia* lesson again in a new costume: **a heading is
not the provision, and an earlier classification is not evidence.** Both states had
been carried as needing counsel to draft from scratch for two passes.

### Captured but NOT usable as a form

| Jurisdiction | Citation | Why |
|---|---|---|
| DC | D.C. Code § 18-908 | This is the Uniform **Electronic** Wills Act. It makes an *electronic* will self-proving and does not reach the paper, wet-signature wills this product generates. Captured so counsel can confirm the District has **no self-proving mechanism for paper wills at all** — which would mean a DC will cannot be self-proved and its witnesses must testify in probate. Deliberately excluded from clause generation. |
| MD | Md. Code, Est. & Trusts § 4-102 | **The same shape as DC.** § 4-102 is the execution provision; the only affidavit forms it prescribes sit inside subsections (c)–(d), which govern **electronic and remotely-witnessed** wills. Maryland appears to have **no self-proving affidavit for an ordinary paper will**. Captured and deliberately excluded from clause generation. **Please confirm.** |
| OH | Ohio Rev. Code § 2107.18 | **Ohio has no self-proving affidavit at all** — ORC ch. 2107 (Wills) contains not one occurrence of "affidavit" or "self-prov". It appears not to need one: § 2107.18 directs the probate court to admit a will **"if it appears from the face of the will"**, taking witness testimony only "in its discretion". Captured as the provision that does the work a self-proving affidavit does elsewhere. This is the only capture carrying an `absentProvision` waiver (see below). **Please confirm that no affidavit should be produced for Ohio.** |

### Blocked (5)

| State | Issue |
|---|---|
| NJ | Folio NXT frameset: content sits in a nested frame, there is no per-section URL, the TOC expands one level per round-trip via JS, the `xhitlist` query endpoint 500s, and the search box ignores programmatic input. Needs a TOC-walking fetch mode or one hand-sourced frame URL. **Do not fall back to the Justia mirror.** **On 2026-08-07 the server stopped answering entirely** — `lis.njleg.state.nj.us` accepts the TLS connection then never responds (120s timeout, HTTP/1.1 and HTTP/2 alike), while `njleg.state.nj.us` serves fine from the same machine, so this is their Folio host and not our network. njleg.state.nj.us still links to the same Folio URL, so nothing has moved. **Retry before doing any engineering.** |
| AR | Official code published only via LexisNexis (`lexisnexis.com/hottopics/arcode/`, reached through an interstitial on arkleg.state.ar.us). CAPTCHA — see below. |
| GA | Official code published only via LexisNexis (`lexisnexis.com/hottopics/gacode`), styled the "Georgia Code Research Tool" and provided by the Georgia Code Revision Commission. CAPTCHA — see below. |
| MS | Official code published only via LexisNexis (`lexisnexis.com/hottopics/mscode/`, linked as "Mississippi Code" from legislature.ms.gov). CAPTCHA — see below. |
| TN | LexisNexis is the Tennessee Code Commission's contracted official publisher; the free unannotated code is on the same platform. CAPTCHA — see below. |

**The LexisNexis wall (AR, GA, MS, TN).** These four are blocked for the same
reason, and it is a wall rather than a puzzle:

1. The TOC is session-scoped — expanding it calls `/r/tocprovider/<session>/toc/<session>`,
   so there is no stable per-section URL to register.
2. A search URL *is* reproducible (`…/container/?pdmfid=…&pdtocsearchterm=53-4-24&…&config=…`
   works with the per-request `crid` stripped), but the results page shows only a
   **truncated snippet** — it cuts off precisely at the prescribed form — and mixes
   in Lexis's copyrighted case annotations.
3. Following the result to the document page (whose URL does carry a stable
   `urn:contentItem:` id) returns a **CAPTCHA validation page**.

Working around a CAPTCHA is not something this pipeline will do. So these four
cannot be harvested at all, and no amount of additional fetch modes changes that.
The options are a hand-sourced capture with its provenance honestly downgraded,
or leaving the form to counsel. **Owner decision required.**

Note for the record: the Supreme Court held in *Georgia v. Public.Resource.Org*,
590 U.S. 255 (2020), that the OCGA — annotations included — is an uncopyrightable
government edict. The obstacle here is purely technical access control, not
copyright. Public.Resource.Org does publish the OCGA, but its newest release is
from 2019, which cannot support a "most current" claim.

### Resolved since the last pass (3)

| State | What it turned out to be |
|---|---|
| IL | ILGA was rebuilt; the old `/legislation/ilcs/documents/*.htm` links soft-404. Sections now come an article at a time from `/legislation/ILCS/details` with a `SeqStart`/`SeqEnd` range. **No prescribed form** — 6-4(b) allows proof by affidavit without prescribing wording. |
| MA | The section URL takes no separator: `/Section2-504`. Massachusetts **does** prescribe a UPC-style form; it is now generated. |
| WV | **The earlier "wrong citation" call was itself wrong.** § 41-5-15's *heading* ("Proof of will while testator living") is misleading; its *body* is West Virginia's witness-affidavit provision. See the finding below. |

### How each source is read

| Method | States |
|---|---|
| Plain fetch | most, incl. IN |
| Headless browser (`render: true`) | UT, SD, WA, AK, VT, CT, HI, NY, TX |
| PDF text extraction (`pdf: true`) | CO, IA, KY, ND, OK, WY, NM |
| GraphQL POST (`graphql: {…}`) | AL |

Kentucky is worth a note: it serves every section as a **PDF behind an opaque
numeric id**, with no section-number URL at all. KRS 394.225 is `id=36262`, found
by reading the chapter-394 listing at `chapter.aspx?id=39195`. Guessing ids is
useless — a nearby id returned the agritourism statute.

**New Mexico repeats the Kentucky trap at chapter scale.** The official publisher
is the NM Compilation Commission (`nmonesource.com`, a Lexum/Decisia install), not
a legislature site, and the smallest unit it will serve is a whole chapter as a
PDF: `/nmos/nmsa/en/<itemId>/1/document.do`. Chapter 45 is item **4393**, found by
walking the *paginated* chapter list at `nav_date.do` (chapter 45 is on page 2).
The ids are opaque and not guessable. Because it is the *Annotated* statutes,
the capture is bounded on the `ANNOTATIONS` heading that follows every section, so
only statutory text is taken.

**Alabama needed a new fetch mode, and Indiana needed none after all.** Both sites
had been written off as "client-side rendering, no stable URL"; both were wrong in
instructive ways.

- *Alabama* (`alison.legislature.state.al.us`) genuinely has no HTML page for a
  section — the site is a React app over a **GraphQL** API. Rather than drive a
  browser, the harvester now issues the same `codeOfAlabamaSection` query the site
  itself issues. This is the best-behaved source in the whole registry: the
  response **is** the section, so there is no chrome to strip, no markers to bound,
  and the drift hash covers statutory text only. The human-readable equivalent is
  `…/code-of-alabama?section=43-8-132`. Adding a state here is a one-line change
  to `variables.displayId`.
- *Indiana* (`iga.in.gov`) renders the code into a **shadow DOM**. That is why it
  defeated both a plain fetch *and* an ordinary rendered scrape — `document.body.innerText`
  returns only site chrome, so a `render: true` source would have failed too and
  looked like a marker bug. What the app actually loads is a static per-title HTML
  file, `/ic/2025/Title_29.html`, which a **plain fetch** reads fine. (Its sibling
  `api.iga.in.gov` demands an API key; the static file does not.) The `IC ` prefix
  is what distinguishes a section heading from its identically-worded table-of-
  contents entry.

**Lesson worth generalising:** when a site "renders client-side", find what its
front end fetches before reaching for a browser. Three of the four states cracked
this pass (AL, IN, NM) were solved by reading the network panel, and the resulting
sources are faster and more stable than `render: true` ones. A browser was needed
only to *discover* the endpoint, never to harvest it.

### The `absentProvision` escape hatch

The content smoke test assumes a capture for `self_proving_affidavit` will *look*
like a self-proving affidavit statute. For Ohio that assumption is false in a way
that matters: the absence **is** the finding. A source may therefore set
`absentProvision: "<reason>"`, which waives the `WRONG_CONTENT` refusal and writes
the reason into the capture, so the exception is recorded rather than silent. The
missing-hallmark `warnings` are still stored. **Use it only where a jurisdiction
genuinely has no such provision — never to force through a bad capture.**

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

**Three jurisdictions may offer no paper-will self-proving mechanism at all — for
two different reasons.** DC and MD prescribe affidavit forms only for *electronic*
or remotely-witnessed wills, so a paper will appears to fall through the gap. Ohio
is different in kind: it has no affidavit provision because § 2107.18 lets the
probate court admit a will on its face, making one largely unnecessary. **The
execution instructions for these three need to say something different from every
other state, and counsel should confirm what.**

**Idaho was printing the wrong form as well as the right one (found and fixed
2026-08-07).** Its extraction was bounded on subsection **(3)** rather than (2), so
the generated clause ran straight through Idaho's *after-the-fact* form and
included that subsection's statutory preamble — "(2) An attested will may at any
time subsequent to its execution be made self-proved by the acknowledgment
thereof…" — as though it were a paragraph for the signer to sign. Idaho now
generates the same three paragraphs as its neighbours. **This is a live state, so
any Idaho document generated before 2026-08-07 carries the defect.** A sweep of
every other generated clause for leaked subsection preambles found no second
instance. Note what did *not* catch this: the verbatim test passed throughout,
because the extra paragraphs really are in the statute — they are simply the wrong
part of it. **Verbatim fidelity is not the same as taking the right excerpt.**

**Texas prints two forms and we take the second.** § 251.104 is the affidavit
annexed to an already-executed will; § 251.1045 is the simultaneous
execution/attestation/self-proving form. We generate § 251.1045, consistent with
the simultaneous-execution convention used for every other state.

**Two distinct statutory models exist** — see the tables above. Assuming every
state follows the Arizona/Florida "prescribed form" pattern would have produced
documents tracking the wrong model in eight states so far.

**Many statutes print two forms** — one for simultaneous execution, one for making
an already-executed will self-proved. We generate the simultaneous-execution form
only. Counsel is asked per state whether the after-the-fact variant should also be
offered.

**Indiana splits its two forms on a different axis, and needs its own question.**
IC 29-1-5-3.1 prints a clause at (c) for an ordinary in-person signing and a second
at (d) for **remote witnessing of separate paper counterparts** — not the usual
simultaneous / after-the-fact pair. We generate (c). **Please confirm that a
product which does not walk a user through a remote signing ceremony should never
offer (d).**

**Indiana also requires no notary at all.** Its clause is an **unsworn declaration
under the penalties for perjury** — no officer, no oath, no seal, no certificate —
so an Indiana document must not print the notary block every other state's form
ends with. This corroborates the seeded `selfProving.requiresNotary: false` for
Indiana, which until now was unverified. **Please confirm.**

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

### Two former weaknesses in these gates — both CLOSED 2026-08-07

**An unbounded capture can still swallow site chrome.** A source with no
`endsBefore` runs to the end of the page. If the section body is long and genuinely
statutory, none of the gates fire — average line length stays prose-like — and the
capture quietly picks up the footer.

This was far more widespread than the earlier note admitted. A sweep on 2026-08-07
found **22 of 46 sources unbounded**, and `endsBefore` was added to 15 of them
(UT SD MT ID ME MI MN NE VA WI IA VT HI NY DC). What that removed was not cosmetic:

- **VT** was 78% chrome — the entire site footer plus a Google Translate language list.
- **WI** was not merely dirty, it was capturing the **wrong range**: `853.04` ran on
  through §§ 853.05 and 853.07, so half the capture was neighbouring sections.
- **ME, WI, IA, SD, ID, VA** all trailed content carrying a **date or timestamp**
  (ME "Data for this page extracted on <time>", WI "(Published 8-5-26)", VA
  "© Copyright ... <year>"). Those move on republication, so these sources were
  *guaranteed* to raise a false amendment alert sooner or later.

The five that remain unbounded (AZ CA NH RI PA) end naturally at the statute — their
pages carry no trailing chrome, so there is nothing to bound on. AL is bounded by
construction (its GraphQL response *is* the section). NJ is not yet captured.

> **Correction.** The previous version of this section said the VA *form text* was
> correct and only the capture was dirty. **That was wrong.** VA's generated clause
> was carrying four paragraphs of the Virginia Law website — including
> `"Cancel LIS Home Lobbyist-in-a-Box Privacy Policy © Copyright Commonwealth of
> Virginia..."` — inside the affidavit. See "the wrong excerpt" below.

**The drift hash covers chrome, not just statute.** Because the hash is taken over
the whole capture, a purely cosmetic site change registers as "this statute
changed". VA fired exactly this false positive on 2026-08-05: a "Helpful Resources"
footer block disappeared, the hash moved, and the statutory text was byte-identical.
This is now closed by the bounding above rather than by changing the hash: the hash
is taken over the isolated text, so once a source is bounded the hash covers
statutory text only. Anyone acting on `statutes:check` should still diff before
believing an amendment alert.

**A third gap, found and fixed on 2026-08-07: line structure was only recovered
from HTML tags, and not every publisher uses HTML ones.** Alabama lays its
signature block out in **DocBook** table markup (`<row>`, `<entry>`), which the
text converter did not treat as line breaks. The capture passed every gate and the
verbatim test — the words were all correct and all in order — but the cells ran
together (`"Witness" + "State of"` → `"WitnessState of"`), and the clause generator
then emitted Alabama's whole form as a single run-on paragraph instead of four.
`</entry>` and `</row>` now break lines.

The general point is that **the verbatim test cannot catch a formatting defect**:
it asks whether our text appears in the statute, and a run-on paragraph still does.
Whitespace damage has to be eyeballed in the generated file. When a state's
`gen-self-proving-forms` output shows a paragraph count far below its neighbours'
(Alabama reported `1 paragraph(s)` where comparable states report 4), that is the
tell.

### The wrong excerpt: a silent fallback in the clause generator (fixed 2026-08-07)

Bounding the captures exposed a worse defect one layer down, in
`gen-self-proving-forms.mjs`. Each state's form is cut out of its capture with a
`{ from, to }` pair. When the `to` marker did not match, the code did this:

```js
let end = to ? text.indexOf(to, start + 1) : -1;
if (end === -1) end = text.length;      // <-- silently takes the whole capture
```

So a *stale bound* did not fail — it quietly widened the form to everything after
`from`. Three states were affected, and none of them failed a single test:

| State | Bound that never matched | What was printed inside the affidavit |
|-------|--------------------------|----------------------------------------|
| VA | `"B."` — § 64.2-452 has no lettered subsections | operative statute, the amendment history, **and four paragraphs of website chrome** |
| KS | `"History:"` — the Kansas page prints no such heading | two paragraphs of statute addressed to the **court**, not the signer |
| DE | `"(b)"` — the Delaware section is unlettered | the session-law citation `59 Del. Laws, c. 384, § 1;` |

**Why nothing caught it.** The verbatim test asks whether our text appears in the
source statute. All of this text *did* appear there, so it was verbatim — it was
simply not the form. This is the same failure mode as the Idaho wrong-subsection
bug: **verbatim fidelity is not the same property as taking the right excerpt.**

The fallback is now removed. An unmatched `to` refuses the state with
`end bound "..." not found — refusing to run to end of capture`, so a stale bound
shows up as a *missing* form (loud, and caught by the count of generated states)
rather than a *padded* one. Any VA, KS or DE document generated before 2026-08-07
carries the old text.

## Keeping the legal review checklist current

`docs/LEGAL_REVIEW_CHECKLIST.docx` is what actually goes to counsel, and several of
its items are downstream of this research. **It is a binary file that cannot be
diffed, so nothing will warn you when it goes stale — it has to be updated
deliberately, in the same commit as the finding that changed it.**

| Checklist item | Update it when |
|---|---|
| **A7** Self-proving affidavit | The count of states with verbatim form text changes, or a new state prints two forms and we pick one. |
| **B1** Execution formalities | Capture proves another seed citation wrong (or wrongly condemned). Keep the running tally honest. |
| **B2** Self-proving affidavit exceptions | Any state moves between the three buckets: prescribes a form / prescribes none / has no mechanism at all. This is the item most likely to go stale. |
| **B4** Excluded states | A not-for-sale state gets captured, or an exclusion is cleared. |
| **B5** Louisiana | The decision to leave LA out of this pipeline changes. |
| **B8** Provenance of the statutory text | **Every time the capture count changes.** It states "45 of a target 50" and names the outstanding jurisdictions; that sentence is wrong the moment another state lands. |

The counsel-facing framing lives in B8 and must stay exactly this honest: reproduced
from the state's own published statute, cited, dated, automatically verified against
the source — **desk research by a non-lawyer, not legal review, and no claim that
anything is compliant or current.**

**Owner instruction (Dave, 2026-08-05): nothing goes to the attorney until the
research is complete.** Updating the checklist as we go is preparation, not a
trigger to send it. B8 deliberately says the section is not yet complete so that a
partial version cannot be mistaken for a final one.

## Adding a state

Add an entry to `SOURCES` in `scripts/harvest-statutes.mjs` with the state, key,
citation, URL, and `startsWith` / `endsBefore` markers, then run the harvester and
**read the captured text** before drafting against it. The gates catch obvious
failures; they do not certify that the capture is the right section.
