#!/usr/bin/env node
/**
 * Statute harvester — capture verbatim statutory text from each state's own
 * official publisher, with a citation, a source URL, a retrieval date and a
 * content hash.
 *
 * WHY
 * ---
 * The clause library is moving off placeholder text and onto text drafted
 * against the governing statute (see docs/CLAUSE_RESEARCH_METHOD.md). To draft
 * against a statute honestly we need its ACTUAL words, not a recollection of
 * them — especially in states that prescribe a mandatory form, where paraphrase
 * is a defect rather than a style choice.
 *
 * Statutory text is not copyrightable (government edicts doctrine), and every
 * state publishes it free. So we read the state's own site: it is both the
 * authoritative source and the one we may safely reproduce. We deliberately take
 * statutory text only — never a commercial publisher's annotations, headnotes or
 * editorial apparatus.
 *
 * WHAT THIS IS NOT
 * ----------------
 * This does not make anything "compliant" or "approved". It captures a primary
 * source so that a human — ultimately counsel — can verify it. The content hash
 * exists so a later run can tell us "this statute changed since we drafted
 * against it", which is the free version of a paid database's currency alerting.
 *
 * USAGE
 *   node scripts/harvest-statutes.mjs              # all registered sources
 *   node scripts/harvest-statutes.mjs AZ FL NV     # specific states
 *   node scripts/harvest-statutes.mjs --check      # re-fetch, report drift only
 */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "docs/statutes");

/**
 * Source registry: where each state publishes the statute we need.
 *
 * `startsWith` / `endsBefore` isolate the section from a page that may hold a
 * whole chapter. Keep them conservative — better to capture too much context
 * than to silently truncate prescribed language.
 */
const SOURCES = [
  {
    state: "AZ",
    key: "self_proving_affidavit",
    citation: "A.R.S. § 14-2504",
    url: "https://www.azleg.gov/ars/14/02504.htm",
    startsWith: "14-2504.",
  },
  {
    state: "FL",
    key: "self_proving_affidavit",
    citation: "Fla. Stat. § 732.503",
    url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0732/Sections/0732.503.html",
    startsWith: "732.503",
    endsBefore: "History.—",
  },
  {
    state: "NV",
    key: "self_proving_affidavit",
    citation: "NRS § 133.050",
    url: "https://www.leg.state.nv.us/nrs/nrs-133.html",
    startsWith: "NRS 133.050",
    endsBefore: "NRS 133.060",
  },
  // --- Sources that a plain fetch cannot read -------------------------------
  // Left in the registry deliberately: a state we cannot harvest is a GAP that
  // must stay visible, not one quietly dropped from the list. Each needs either
  // a headless browser or a hand-sourced capture before it can be drafted against.
  {
    state: "UT",
    key: "self_proving_affidavit",
    citation: "Utah Code § 75-2-504",
    url: "https://le.utah.gov/xcode/Title75/Chapter2/75-2-S504.html",
    startsWith: "75-2-504",
    // Statute text is rendered client-side; needs a real browser.
    render: true,
  },
  {
    state: "SD",
    key: "self_proving_affidavit",
    citation: "SDCL § 29A-2-504",
    url: "https://sdlegislature.gov/Statutes/29A-2-504",
    startsWith: "29A-2-504",
    // Single-page app: the server returns a JS shell for page and API alike.
    render: true,
  },
  {
    state: "MT",
    key: "self_proving_affidavit",
    citation: "Mont. Code Ann. § 72-2-524",
    url: "https://archive.legmt.gov/bills/mca/title_0720/chapter_0020/part_0050/section_0240/0720-0020-0050-0240.html",
    startsWith: "72-2-524",
  },
  {
    state: "OR",
    key: "self_proving_affidavit",
    citation: "ORS § 113.055",
    url: "https://www.oregonlegislature.gov/bills_laws/ors/ors113.html",
    startsWith: "113.055",
    endsBefore: "113.065",
  },
  {
    state: "WA",
    key: "self_proving_affidavit",
    citation: "RCW § 11.20.020",
    url: "https://app.leg.wa.gov/rcw/default.aspx?cite=11.20.020",
    // Anchored on the section title: the bare section number also appears in
    // breadcrumbs and link markup, which yields a capture of the site nav.
    startsWith: "Application for probate",
    endsBefore: "[ ",
    // Section body is rendered client-side.
    render: true,
  },
  // --- Batch 2: launch states verified reachable + section marker present -----
  {
    state: "CA",
    key: "self_proving_affidavit",
    citation: "Cal. Prob. Code § 8220",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PROB&sectionNum=8220",
    startsWith: "8220.",
  },
  {
    state: "DE",
    key: "self_proving_affidavit",
    citation: "12 Del. C. § 1305",
    url: "https://delcode.delaware.gov/title12/c013/index.html",
    // The page renders "§" on its own line, so anchor on the numbered title.
    startsWith: "1305. Self-proved will.",
    endsBefore: "1306.",
  },
  {
    state: "ID",
    key: "self_proving_affidavit",
    citation: "Idaho Code § 15-2-504",
    url: "https://legislature.idaho.gov/statutesrules/idstat/Title15/T15CH2/SECT15-2-504/",
    startsWith: "15-2-504.",
  },
  {
    state: "KS",
    key: "self_proving_affidavit",
    citation: "K.S.A. § 59-606",
    url: "https://www.ksrevisor.org/statutes/chapters/ch59/059_006_0006.html",
    // Anchored on the title: the bare number also appears in the nav breadcrumb.
    startsWith: "Execution and attestation; self-proved wills",
    endsBefore: "History:",
  },
  {
    state: "ME",
    key: "self_proving_affidavit",
    citation: "18-C M.R.S. § 2-503",
    url: "https://legislature.maine.gov/statutes/18-C/title18-Csec2-503.html",
    startsWith: "2-503.",
  },
  {
    state: "MI",
    key: "self_proving_affidavit",
    citation: "Mich. Comp. Laws § 700.2504",
    url: "https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-700-2504",
    startsWith: "700.2504",
  },
  {
    state: "MN",
    key: "self_proving_affidavit",
    citation: "Minn. Stat. § 524.2-504",
    url: "https://www.revisor.mn.gov/statutes/cite/524.2-504",
    startsWith: "524.2-504",
  },
  {
    state: "NE",
    key: "self_proving_affidavit",
    citation: "Neb. Rev. Stat. § 30-2329",
    url: "https://nebraskalegislature.gov/laws/statutes.php?statute=30-2329",
    startsWith: "30-2329",
  },
  {
    state: "NH",
    key: "self_proving_affidavit",
    citation: "N.H. RSA § 551:2-a",
    url: "https://www.gencourt.state.nh.us/rsa/html/LVI/551/551-2-a.htm",
    startsWith: "551:2-a",
  },
  {
    state: "RI",
    key: "self_proving_affidavit",
    citation: "R.I. Gen. Laws § 33-7-26",
    url: "https://webserver.rilegislature.gov/Statutes/TITLE33/33-7/33-7-26.htm",
    startsWith: "33-7-26",
  },
  {
    state: "SC",
    key: "self_proving_affidavit",
    citation: "S.C. Code § 62-2-503",
    url: "https://www.scstatehouse.gov/code/t62c002.php",
    startsWith: "62-2-503",
    endsBefore: "SECTION 62-2-504",
  },
  {
    state: "VA",
    key: "self_proving_affidavit",
    citation: "Va. Code § 64.2-452",
    url: "https://law.lis.virginia.gov/vacode/title64.2/chapter4/section64.2-452/",
    startsWith: "64.2-452",
  },
  {
    state: "WI",
    key: "self_proving_affidavit",
    citation: "Wis. Stat. § 853.04",
    url: "https://docs.legis.wisconsin.gov/statutes/statutes/853/i/04",
    startsWith: "853.04",
  },
  {
    state: "WV",
    key: "self_proving_affidavit",
    citation: "W. Va. Code § 41-5-15",
    url: "https://code.wvlegislature.gov/41-5-15/",
    // The section HEADING ("Proof of will while testator living") is misleading and
    // is what got this citation marked wrong earlier. The BODY is in fact West
    // Virginia's witness-affidavit provision: attesting witnesses may swear an
    // affidavit before an officer, and if preserved with the will it carries the
    // same probative value as their live testimony. Two things counsel must see:
    // it prescribes NO form ("such facts as would be required of them in testimony
    // in court"), and the affidavit is INADMISSIBLE if the will is contested —
    // materially weaker than a UPC self-proving affidavit.
    startsWith: "41-5-15. Proof of will while testator living.",
    endsBefore: "Previous",
  },
  // --- Batch 3 ----------------------------------------------------------------
  {
    state: "PA",
    key: "self_proving_affidavit",
    citation: "20 Pa.C.S. § 3132.1",
    url: "https://www.legis.state.pa.us/WU01/LI/LI/CT/HTM/20/00.031.032.001..HTM",
    startsWith: "3132.1",
  },
  {
    state: "IL",
    key: "self_proving_affidavit",
    citation: "755 ILCS 5/6-4",
    // ILGA was rebuilt: the old /legislation/ilcs/documents/*.htm deep links are
    // gone (they soft-404). Sections are now served a whole article at a time from
    // /legislation/ILCS/details with a SeqStart/SeqEnd range — this is Article VI.
    url: "https://www.ilga.gov/legislation/ILCS/details?MajorTopic=&Chapter=&ActName=Probate%20Act%20of%201975.&ActID=2104&ChapterID=60&ChapAct=755+ILCS+5%2F&SeqStart=8200000&SeqEnd=10400000",
    // NO PRESCRIBED FORM. 6-4(b) lets a witness's statements be made by testimony,
    // by an attestation clause, or by affidavit, but nowhere prescribes wording —
    // Illinois belongs with the drafted_from_rule states, not the Arizona pattern.
    startsWith: "Sec. 6-4.",
    endsBefore: "(755 ILCS 5/6-5)",
  },
  // --- Batch 4: states that publish their code as PDF ------------------------
  {
    state: "IA",
    key: "self_proving_affidavit",
    citation: "Iowa Code § 633.279",
    url: "https://www.legis.iowa.gov/docs/code/633.279.pdf",
    startsWith: "633.279 Signed and witnessed",
    pdf: true,
  },
  {
    state: "CO",
    key: "self_proving_affidavit",
    citation: "C.R.S. § 15-11-504",
    url: "https://leg.colorado.gov/sites/default/files/images/olls/crs2023-title-15.pdf",
    startsWith: "15-11-504.",
    endsBefore: "15-11-505.",
    pdf: true,
  },
  {
    state: "WY",
    key: "self_proving_affidavit",
    citation: "Wyo. Stat. § 2-6-114",
    url: "https://wyoleg.gov/statutes/compress/title02.pdf",
    startsWith: "2-6-114.",
    endsBefore: "2-6-115.",
    pdf: true,
  },
  {
    state: "OK",
    key: "self_proving_affidavit",
    citation: "84 O.S. § 55",
    url: "https://oksenate.gov/sites/default/files/2019-12/os84.pdf",
    startsWith: "§84-55.",
    endsBefore: "§84-56",
    pdf: true,
  },
  {
    state: "ND",
    key: "self_proving_affidavit",
    // CORRECTED CITATION. The seed carried § 30.1-08-03, which is "Holographic
    // will". North Dakota's self-proved will provision is § 30.1-08-04 (2-504).
    citation: "N.D. Cent. Code § 30.1-08-04",
    url: "https://ndlegis.gov/cencode/t30-1c08.pdf",
    // Citation corrected from the seed's § 30.1-08-03 ("Holographic will").
    url2Note: "chapter page is a TOC; the text is in the chapter PDF",
    startsWith: "30.1-08-04.",
    endsBefore: "30.1-08-05.",
    pdf: true,
  },
  {
    state: "AK",
    key: "self_proving_affidavit",
    citation: "AS § 13.12.504",
    url: "https://www.akleg.gov/basis/statutes.asp#13.12.504",
    startsWith: "Sec. 13.12.504",
    endsBefore: "Sec. 13.12.505",
    render: true,
  },
  {
    state: "VT",
    key: "self_proving_affidavit",
    citation: "14 V.S.A. § 108",
    url: "https://legislature.vermont.gov/statutes/section/14/003/00108",
    startsWith: "108.",
    render: true,
  },
  {
    state: "CT",
    key: "self_proving_affidavit",
    citation: "Conn. Gen. Stat. § 45a-285",
    // § 45a-285 lives in chapter 802b (probate/administration), not 802a (wills).
    url: "https://www.cga.ct.gov/current/pub/chap_802b.htm",
    startsWith: "Sec. 45a-285",
    endsBefore: "Sec. 45a-286",
    render: true,
  },
  // --- Batch 5: reachable only with a real browser ----------------------------
  {
    state: "HI",
    key: "self_proving_affidavit",
    citation: "Haw. Rev. Stat. § 560:2-504",
    url: "https://www.capitol.hawaii.gov/hrscurrent/Vol12_Ch0501-0588/HRS0560/HRS_0560-0002-0504.htm",
    startsWith: "560:2-504",
    render: true,
  },
  {
    state: "NY",
    key: "self_proving_affidavit",
    citation: "N.Y. SCPA § 1406",
    url: "https://www.nysenate.gov/legislation/laws/SCP/1406",
    startsWith: "1406",
    render: true,
  },
  {
    state: "MA",
    key: "self_proving_affidavit",
    citation: "Mass. G.L. c. 190B § 2-504",
    // The section URL takes NO separator before the number ("/Section2-504");
    // "/Section/2-504" and "/Section 2-504" are what 404'd previously.
    url: "https://malegislature.gov/Laws/GeneralLaws/PartII/TitleII/Chapter190B/Section2-504",
    // En dashes, not hyphens: the page writes "Section 2&ndash;504. [Self&ndash;Proved
    // Will.]" in the body while the page heading uses plain hyphens. Anchor on the
    // body form. The section is last on the page, so the only available end marker
    // is the start of the site footer — without it the capture swallows the
    // sign-in/search chrome, which the gates do not catch on a long, real section.
    startsWith: "Section 2–504. [Self–Proved Will.]",
    endsBefore: "Site Information & Links",
  },
  {
    state: "DC",
    key: "self_proving_affidavit",
    // IMPORTANT: this is the Uniform ELECTRONIC Wills Act. § 18-908 makes an
    // ELECTRONIC will self-proving; it does not reach the paper, wet-signature
    // wills this product generates. Captured so counsel can confirm the District
    // has no self-proving mechanism for paper wills at all — which would mean a
    // DC will cannot be self-proved and its witnesses must testify in probate.
    citation: "D.C. Code § 18-908",
    url: "https://code.dccouncil.gov/us/dc/council/code/sections/18-908",
    startsWith: "§ 18–908. Electronic will attested",
    render: true,
  },
  // --- Batch 6: four of the five states not offered for sale, plus KY ----------
  // Owner decision 2026-08-05: research all 50 jurisdictions except Louisiana,
  // whose civil-law will formalities need their own treatment. MO/NC/OH/TX are
  // researched here even though they are not currently sold, so that turning a
  // state on later is a config change rather than a fresh research project.
  {
    state: "NC",
    key: "self_proving_affidavit",
    citation: "N.C.G.S. § 31-11.6",
    url: "https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_31/GS_31-11.6.html",
    startsWith: "§ 31-11.6.",
    // Bound before the trailing session-law history note.
    endsBefore: "(1977, c. 795",
  },
  {
    state: "MO",
    key: "self_proving_affidavit",
    citation: "Mo. Rev. Stat. § 474.337",
    url: "https://revisor.mo.gov/main/OneSection.aspx?section=474.337",
    startsWith: "474.337.",
    endsBefore: "(L. 1980",
  },
  {
    state: "TX",
    key: "self_proving_affidavit",
    // TWO FORMS, and we take the second. § 251.104 is the affidavit annexed to an
    // already-executed will; § 251.1045 is the simultaneous execution/attestation/
    // self-proving form, which matches what this product generates and is the
    // convention used for every other state here.
    citation: "Tex. Est. Code § 251.1045",
    // /Docs/ES/htm/ES.251.htm 302s to a client-rendered chapter view, so a plain
    // fetch gets the site shell and nothing else.
    url: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.251.htm",
    startsWith: "Sec. 251.1045.",
    endsBefore: "Added by Acts",
    render: true,
  },
  {
    state: "OH",
    key: "self_proving_affidavit",
    // OHIO HAS NO SELF-PROVING AFFIDAVIT — and appears not to need one. Chapter
    // 2107 (Wills) contains ZERO occurrences of "affidavit" or "self-prov".
    // Instead § 2107.18 lets the probate court admit a will "if it appears from the
    // face of the will", taking witness testimony only "in its discretion". So the
    // provision that does the work a self-proving affidavit does elsewhere is the
    // probate-admission section, which is what we capture.
    // (A web search asserted Ohio's provision was "ORC 2107.24". It is not —
    // 2107.24 is the harmless-error / document-treated-as-a-will section.)
    citation: "Ohio Rev. Code § 2107.18",
    url: "https://codes.ohio.gov/ohio-revised-code/section-2107.18",
    startsWith: "The probate court shall admit a will to probate",
    endsBefore: "Available Versions",
    // The smoke test looks for the hallmarks of a self-proving affidavit statute
    // and would refuse this capture as WRONG_CONTENT. Here their absence IS the
    // finding, so the refusal is waived — with the reason recorded in the capture.
    absentProvision:
      "Ohio has no self-proving affidavit statute; ORC ch. 2107 contains no 'affidavit' or 'self-prov' text. § 2107.18 admits a will on the face of the will, with witness testimony only at the court's discretion.",
  },
  {
    state: "KY",
    key: "self_proving_affidavit",
    citation: "KRS § 394.225",
    // Kentucky serves each section as a PDF behind an opaque numeric id; there is
    // no section-number URL. 394.225 ("Self-proved will") is id=36262, found from
    // the chapter 394 listing at chapter.aspx?id=39195.
    url: "https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=36262",
    startsWith: "394.225",
    endsBefore: "Effective:",
    pdf: true,
  },
  {
    state: "MD",
    key: "self_proving_affidavit",
    // Maryland has NO self-proving affidavit for an ordinary paper will. § 4-102 is
    // the execution provision; the only affidavit forms it prescribes sit inside
    // subsections (c)/(d), which govern ELECTRONIC and remotely-witnessed wills.
    // Structurally this is the DC problem again (see § 18-908 below): capture the
    // governing section so counsel can confirm that a Maryland paper will simply
    // cannot be made self-proved, rather than leaving Maryland as a silent gap.
    citation: "Md. Code, Est. & Trusts § 4-102",
    url: "https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=get&section=4-102&enactments=false",
    // Section numbers on this site are en-dashed: "§4–102." The section is last on
    // the page, so bound it on the prev/next control that follows subsection (f) —
    // unbounded, the capture runs on into the site's open-data footer.
    startsWith: "§4–102.",
    endsBefore: "PreviousNext",
  },
  {
    state: "AL",
    key: "self_proving_affidavit",
    citation: "Ala. Code § 43-8-132",
    // Alabama's official publisher (alison.legislature.state.al.us) has no HTML
    // page for a section — the site is a client-side app over a GraphQL API, which
    // is why every plain fetch of it has come back empty. This is the same query
    // the site's own "Code of Alabama" browser issues; the human-readable deep
    // link for the same section is
    //   https://alison.legislature.state.al.us/code-of-alabama?section=43-8-132
    // Because the response IS the section, there is nothing after it to bound
    // against — the usual endsBefore is genuinely unnecessary here, and the drift
    // hash covers statutory text only, with no site chrome to churn.
    url: "https://alison.legislature.state.al.us/graphql",
    graphql: {
      operationName: "codeOfAlabamaSection",
      query:
        "query codeOfAlabamaSection($displayId: String!) {\n" +
        "  codesOfAlabama(where: {type: {eq: Section}, displayId: {eq: $displayId}}, versions: true) {\n" +
        "    data { displayId title content history effectiveDate }\n" +
        "  }\n" +
        "}",
      variables: { displayId: "43-8-132" },
      pick: (json) => {
        const s = json?.data?.codesOfAlabama?.data?.[0];
        if (!s?.content) return null;
        return `<p>${s.title}</p>${s.content}<p>${s.history ?? ""}</p>`;
      },
    },
    startsWith: "Section 43-8-132",
  },
  {
    state: "IN",
    key: "self_proving_affidavit",
    citation: "Ind. Code § 29-1-5-3.1",
    // iga.in.gov is a React app that renders the code into a SHADOW DOM, so a
    // plain fetch AND an ordinary rendered-page scrape both come back empty —
    // document.body.innerText sees only site chrome. What the app actually loads
    // is this static per-title HTML file, which a plain fetch reads fine (no
    // Referer or API key needed; api.iga.in.gov, by contrast, demands one).
    //
    // The file is the whole of Title 29, so bounding matters. The "IC " prefix is
    // what separates the section heading from its table-of-contents entry, which
    // is otherwise the identical string.
    url: "https://iga.in.gov/ic/2025/Title_29.html",
    startsWith: "IC 29-1-5-3.1",
    endsBefore: "IC 29-1-5-3.2",
  },
  {
    state: "NM",
    key: "self_proving_affidavit",
    citation: "NMSA 1978, § 45-2-504",
    // New Mexico's official publisher is the NM Compilation Commission
    // (nmonesource.com, a Lexum/Decisia install), NOT a legislature site. It has
    // no per-section URL: the smallest unit it serves is a whole chapter, as a
    // PDF at /nmos/nmsa/en/<itemId>/1/document.do. Chapter 45 (Uniform Probate
    // Code) is item 4393, found by walking the paginated chapter list at
    // nav_date.do — the ids are opaque and NOT guessable (same trap as KY).
    //
    // This is "New Mexico Statutes ANNOTATED", and the annotations are editorial
    // matter we must not reproduce. Bounding on the ANNOTATIONS heading that
    // follows every section keeps the capture to the statutory text alone.
    url: "https://nmonesource.com/nmos/nmsa/en/4393/1/document.do",
    startsWith: "45-2-504. Self-proved will.",
    endsBefore: "ANNOTATIONS",
    pdf: true,
  },
  {
    state: "NJ",
    key: "self_proving_affidavit",
    citation: "N.J.S.A. § 3B:3-4",
    // REVISED DIAGNOSIS (2026-08-05). The earlier note said no official New Jersey
    // publisher was reachable. That is wrong: the official one is
    // https://lis.njleg.state.nj.us — "New Jersey Statutes (Unannotated)", current
    // through P.L.2025, c.346. It loads fine in a real browser.
    //
    // The actual blocker is its shape, not its availability. It is a Folio NXT
    // frameset: content lives in a nested <frame>, there is no per-section URL, and
    // the table of contents expands one level per server round-trip via JS handlers.
    // The xhitlist query endpoint 500s and the search box ignores programmatic input.
    //
    // So this needs EITHER a puppeteer routine that walks the TOC (Statutes -> Title
    // 3B -> chapter 3 -> 3B:3-4) and reads the document frame, OR a human to click
    // through once and paste the resulting frame URL here. Do NOT fall back to the
    // Justia mirror: it is behind Cloudflare and is weaker provenance than every
    // other source in this file.
    url: "https://lis.njleg.state.nj.us/nxt/gateway.dll/statutes/1?f=templates&fn=default.htm&vid=Publish:10.1048/Enu",
    startsWith: "3B:3-4",
    render: true,
    blocked: "Official publisher IS reachable (lis.njleg.state.nj.us, current through P.L.2025 c.346) but is a Folio NXT frameset with no per-section URL — content sits in a nested frame behind a JS-expanded TOC. Needs a TOC-walking fetch mode or a hand-sourced frame URL.",
  },
];

const UA = "Mozilla/5.0 (compatible; MDWT statute research; +legal form verification)";

/** Chrome used only for sources that render their statute text client-side. */
const CHROME_PATH =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

let browserPromise = null;
/**
 * Launch Chrome once and share it across all rendered sources. Started lazily so
 * a run with no JS-gated sources never pays the startup cost.
 */
async function getBrowser() {
  if (!browserPromise) {
    browserPromise = (async () => {
      const { default: puppeteer } = await import("puppeteer-core");
      return puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: "new",
        args: ["--no-sandbox", "--disable-gpu"],
      });
    })();
  }
  return browserPromise;
}

/**
 * Fetch a page with a real browser, for sites that ship a JavaScript shell and
 * render the statute client-side. Slower and heavier than a plain fetch, so it
 * is opt-in per source via `render: true` rather than the default.
 */
async function fetchRendered(url, waitForText) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent(UA);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    // The shell paints before the statute arrives, so wait for the section text
    // itself rather than trusting a load event.
    if (waitForText) {
      await page
        .waitForFunction(
          (needle) => document.body.innerText.includes(needle),
          { timeout: 20000 },
          waitForText,
        )
        .catch(() => {}); // fall through — the content check will catch a miss
    }
    return await page.content();
  } finally {
    await page.close();
  }
}

/**
 * Extract text from a PDF, for the states that publish their code only as PDF.
 *
 * pdfjs hands back positioned glyph runs, not words, so joining them naively
 * produces "PROBA TE CODE" and "F ormal". Rebuild lines from the glyph positions
 * instead: start a new line when the baseline moves, and insert a space only when
 * there is a real horizontal gap between one run and the next.
 */
/**
 * Fetch a statute from a GraphQL endpoint.
 *
 * Alabama publishes its code only through a GraphQL API: alison.legislature.state.al.us
 * renders every section client-side from a POST to /graphql, so there is no HTML
 * page to fetch and no per-section document to download. Driving a headless
 * browser would work but is slower and far more fragile than asking the same API
 * the site itself asks — and the API returns exactly the section, with no site
 * chrome to strip and nothing to bound.
 *
 * `spec.pick` walks the response to the field holding the statute's HTML, so the
 * shape of one state's schema stays in that state's source entry.
 */
async function fetchGraphql(url, spec) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "User-Agent": UA, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      operationName: spec.operationName,
      query: spec.query,
      variables: spec.variables,
    }),
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  if (json.errors?.length) throw new Error(`GraphQL: ${json.errors[0].message}`);

  const picked = spec.pick(json);
  if (!picked) throw new Error("GraphQL response had no content at the expected path");
  return picked;
}

async function fetchPdfText(url) {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    redirect: "follow",
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const doc = await getDocument({
    data: new Uint8Array(await res.arrayBuffer()),
    useSystemFonts: true,
  }).promise;

  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const items = (await (await doc.getPage(i)).getTextContent()).items;
    let line = "";
    let prevEnd = null;
    let prevY = null;
    for (const it of items) {
      if (!it.str) continue;
      const x = it.transform[4];
      const y = it.transform[5];
      if (prevY !== null && Math.abs(y - prevY) > 2) {
        out += line.trim() + "\n";
        line = "";
        prevEnd = null;
      }
      if (prevEnd !== null && x - prevEnd > 1.2) line += " ";
      line += it.str;
      prevEnd = x + (it.width || 0);
      prevY = y;
    }
    out += line.trim() + "\n";
  }
  return out;
}

/**
 * Fetch a page as text, following redirects and honouring the page's charset.
 *
 * Several legislature sites still serve windows-1252. Decoding those as UTF-8
 * turns section symbols and typographic punctuation into replacement characters,
 * which silently corrupts the very text we are trying to capture verbatim.
 */
async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const buf = Buffer.from(await res.arrayBuffer());
  const declared = /charset=["']?([\w-]+)/i.exec(res.headers.get("content-type") ?? "")?.[1];
  const sniffed = /charset=["']?([\w-]+)/i.exec(buf.subarray(0, 2048).toString("latin1"))?.[1];
  let enc = (declared || sniffed || "utf-8").toLowerCase();
  if (enc === "iso-8859-1" || enc === "windows-1252") enc = "latin1";

  try {
    return new TextDecoder(enc).decode(buf);
  } catch {
    return buf.toString("utf8");
  }
}

/** HTML → readable plain text, preserving line structure that matters in forms. */
function htmlToText(html) {
  let s = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    // `entry`/`row` are DocBook table tags, not HTML ones. Alabama's publisher
    // lays the signature block out as a DocBook table, so without these the
    // cells run together — "Witness" + "State of" became "WitnessState of".
    .replace(/<\/(p|div|tr|li|h\d|entry|row)>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&sect;/g, "§")
    .replace(/&mdash;/g, "—")
    // Massachusetts and Maryland write their section numbers and bracketed form
    // headings with en dashes ("Section 2&ndash;504", "&sect;4&ndash;102"), and
    // Massachusetts uses them inside the prescribed form itself. Leaving this
    // undecoded writes a literal "&ndash;" into text we reproduce verbatim.
    .replace(/&ndash;/g, "–")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rsquo;/g, "’")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    // Numeric entities. Statute pages lean on these heavily for the whitespace
    // inside form blanks (&#xA0;, &#x2003;), so leaving them raw corrupts the
    // captured form text.
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    // Normalize exotic spaces to plain spaces so blanks render predictably.
    .replace(/[  -   　]/g, " ");
  return s
    .split("\n")
    .map((l) => l.replace(/[ \t ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/**
 * Cut the page down to the section we asked for.
 *
 * The section number typically appears several times on a page: in a table of
 * contents, as the section heading, and again in the amendment history at the
 * foot. Picking the first or last occurrence blindly gets it wrong in opposite
 * directions (a TOC entry, or a one-line history note). So evaluate EVERY
 * occurrence and keep the longest resulting body — the real section text is
 * substantially longer than either a TOC line or a history note.
 */
function isolate(text, { startsWith, endsBefore }) {
  if (!startsWith) return { text: text.trim(), reason: null };

  const candidates = [];
  let rejected = 0;
  for (let i = text.indexOf(startsWith); i !== -1; i = text.indexOf(startsWith, i + 1)) {
    // A hit immediately followed by ";" or "," is a cross-reference sitting
    // inside some OTHER section ("...as provided in NRS 133.050;"). Capturing
    // one of those silently yields the wrong statute, so drop them outright.
    const after = text.slice(i + startsWith.length, i + startsWith.length + 2);
    if (/^\s*[;,)]/.test(after)) {
      rejected++;
      continue;
    }

    let body = text.slice(i);
    let bounded = false;
    if (endsBefore) {
      const j = body.indexOf(endsBefore, 1);
      if (j > 0) {
        body = body.slice(0, j);
        bounded = true;
      }
    }
    // A section heading normally begins a line; a mention mid-line is weaker
    // evidence but still allowed (some sites prefix the line, e.g. "F.S. ").
    const atLineStart = i === 0 || text[i - 1] === "\n";
    candidates.push({ text: body.trim(), bounded, atLineStart });
  }
  if (!candidates.length) {
    return {
      text: null,
      reason: `start marker "${startsWith}" not found${rejected ? ` (${rejected} cross-reference hit(s) rejected)` : ""}`,
    };
  }

  // Rank: a bounded candidate is a precisely delimited section; an unbounded one
  // probably ran on into the site footer. Then prefer a heading at line start,
  // then the longest body — the real text outruns a table-of-contents line.
  candidates.sort(
    (a, b) =>
      Number(b.bounded) - Number(a.bounded) ||
      Number(b.atLineStart) - Number(a.atLineStart) ||
      b.text.length - a.text.length,
  );
  return { text: candidates[0].text, reason: null };
}

/**
 * Guard against a capture that technically matched but is obviously not
 * statutory text — e.g. a site disclaimer or an amendment-history stub. Cheap
 * insurance against a silently wrong capture being treated as a source.
 */
function looksLikeBoilerplate(text) {
  const head = text.slice(0, 400).toLowerCase();
  return (
    /internet version|is provided as a research tool|printed version will prevail/.test(head) &&
    text.length < 1200
  );
}

/**
 * Strip site chrome (nav menus, search boxes, footers) that survives tag
 * removal. These lines are short, title-cased and repetitive; statutory text is
 * prose. Conservative on purpose — we would rather leave a stray menu item than
 * cut a line of the statute.
 */
const CHROME = /^(menu|search|home|contents|help|toggle navigation|previous section|next section|website search term|print|share|back to top|skip to .*|site help|contact us|privacy notice|disclaimer|accessibility|jobs|email updates.*|copyright.*|all rights reserved.*)$/i;
function stripChrome(text) {
  return text
    .split("\n")
    .filter((l) => !CHROME.test(l.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Does this text actually read like the statute we asked for?
 *
 * A capture can match its markers and still be the wrong thing — a neighbouring
 * section, or a page of navigation. Checking for the substantive hallmarks of a
 * self-proving affidavit statute turns that from a silent error into a warning a
 * human has to clear. NOT a correctness proof: it is a smoke test, and counsel
 * still verifies the text.
 */
const EXPECTED_SIGNALS = {
  self_proving_affidavit: [
    { name: "affidavit/sworn", re: /sworn|affidavit|acknowledg/i },
    { name: "witnesses", re: /witness/i },
    { name: "prescribed form", re: /following form|substantially/i },
  ],
};
function contentWarnings(key, text) {
  return (EXPECTED_SIGNALS[key] ?? [])
    .filter((s) => !s.re.test(text))
    .map((s) => s.name);
}

/**
 * Detect a capture that is mostly site navigation rather than statute.
 *
 * Nav is many short, link-shaped lines; statutory text is long prose sentences.
 * Comparing average line length separates the two reliably and — unlike a list
 * of known menu labels — generalizes to sites we have not seen yet.
 */
function looksLikeNavigation(text) {
  const lines = text.split("\n").filter(Boolean);
  if (lines.length < 12) return false;
  const avg = lines.reduce((n, l) => n + l.length, 0) / lines.length;
  const shortLines = lines.filter((l) => l.length < 40).length / lines.length;
  return avg < 45 && shortLines > 0.7;
}

const sha = (s) => createHash("sha256").update(s, "utf8").digest("hex").slice(0, 16);

/**
 * Today's date on the LOCAL calendar, as YYYY-MM-DD.
 *
 * Deliberately not `toISOString().slice(0, 10)`, which is UTC: run after ~17:00
 * Pacific and every capture gets stamped with TOMORROW's date. "Retrieved on" is a
 * provenance fact an attorney reads off the packet, and a statute captured on a
 * date that has not happened yet is indefensible.
 */
function localDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function harvest(src, { checkOnly }) {
  if (src.blocked) return { ...src, status: "BLOCKED", detail: src.blocked };

  const outPath = join(OUT_DIR, `${src.state}_${src.key}.json`);
  const prior = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : null;

  let raw;
  try {
    raw = src.graphql
      ? await fetchGraphql(src.url, src.graphql)
      : src.pdf
        ? await fetchPdfText(src.url)
        : src.render
          ? await fetchRendered(src.url, src.startsWith)
          : await fetchPage(src.url);
  } catch (err) {
    return { ...src, status: "FETCH_FAILED", detail: err.message };
  }

  // PDF text is already plain; only HTML needs tag stripping.
  const isolated = isolate(src.pdf ? raw : htmlToText(raw), src);
  if (!isolated.text) return { ...src, status: "EXTRACT_FAILED", detail: isolated.reason };
  const text = stripChrome(isolated.text);
  if (text.length < 400) {
    return { ...src, status: "TOO_SHORT", detail: `${text.length} chars — check markers` };
  }
  if (looksLikeBoilerplate(text)) {
    return { ...src, status: "BOILERPLATE", detail: "captured site disclaimer, not statute" };
  }
  if (looksLikeNavigation(text)) {
    return { ...src, status: "NAVIGATION", detail: "captured site menu, not statute — fix markers" };
  }
  const warnings = contentWarnings(src.key, text);
  if (warnings.length >= 2 && !src.absentProvision) {
    // Missing most of the hallmarks means this is very likely the wrong section
    // or a page of navigation. Refuse it rather than write a bad source file.
    return {
      ...src,
      status: "WRONG_CONTENT",
      detail: `missing: ${warnings.join(", ")} — likely wrong section`,
    };
  }

  const hash = sha(text);
  const changed = prior && prior.hash !== hash;

  if (checkOnly) {
    return {
      ...src,
      status: !prior ? "NOT_CAPTURED" : changed ? "CHANGED" : "UNCHANGED",
      detail: changed ? `${prior.hash} -> ${hash}` : "",
    };
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        state: src.state,
        key: src.key,
        citation: src.citation,
        sourceUrl: src.url,
        retrievedAt: localDate(),
        hash,
        chars: text.length,
        // Non-empty means a hallmark of this statute type was not found; a human
        // must confirm the capture is the right section before drafting from it.
        warnings,
        // Set only where the jurisdiction has NO provision of this type at all, so
        // the capture is deliberately of the section that governs instead. Carries
        // the reason into the capture so the exception is never silent.
        ...(src.absentProvision ? { absentProvision: src.absentProvision } : {}),
        // Verbatim statutory text. Do not hand-edit — re-run the harvester.
        text,
      },
      null,
      2,
    ) + "\n",
  );

  return {
    ...src,
    status: changed ? "UPDATED (text changed!)" : prior ? "OK (unchanged)" : "OK (new)",
    detail: `${text.length} chars, hash ${hash}` + (warnings.length ? `  ⚠ missing: ${warnings.join(", ")}` : ""),
  };
}

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const wanted = args.filter((a) => /^[A-Z]{2}$/.test(a));
const targets = wanted.length ? SOURCES.filter((s) => wanted.includes(s.state)) : SOURCES;

console.log(
  `${checkOnly ? "Checking" : "Harvesting"} ${targets.length} source(s)\n` + "-".repeat(72),
);

const results = [];
for (const src of targets) {
  const r = await harvest(src, { checkOnly });
  results.push(r);
  console.log(`${r.state}  ${r.citation.padEnd(28)}  ${r.status}${r.detail ? "  — " + r.detail : ""}`);
}

if (browserPromise) await (await browserPromise).close();

const blocked = results.filter((r) => r.status === "BLOCKED");
const bad = results.filter(
  (r) =>
    r.status.includes("FAILED") ||
    ["TOO_SHORT", "BOILERPLATE", "NAVIGATION", "WRONG_CONTENT"].includes(r.status),
);
const ok = results.length - bad.length - blocked.length;

console.log("-".repeat(72));
console.log(`${ok} captured, ${blocked.length} blocked, ${bad.length} failed`);

if (bad.length) {
  console.log(`\n${bad.length} source(s) need a URL or marker fix in SOURCES:`);
  for (const b of bad) console.log(`  ${b.state}  ${b.status}  — ${b.detail}`);
}
if (blocked.length) {
  console.log(`\n${blocked.length} source(s) cannot be fetched without a browser — still UNCAPTURED:`);
  for (const b of blocked) console.log(`  ${b.state}  ${b.citation}\n      ${b.detail}`);
}
if (bad.length) process.exitCode = 1;
