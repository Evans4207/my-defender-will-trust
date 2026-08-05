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
    startsWith: "41-5-15",
    // WRONG CITATION (inherited from the seed): §41-5-15 is "Proof of will while
    // testator living", not a self-proving affidavit provision. Needs research to
    // find West Virginia's actual provision — do not draft against this.
    blocked: "Inherited citation is wrong: §41-5-15 is 'Proof of will while testator living'. West Virginia's self-proving provision must be identified before capture.",
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
    .replace(/<\/(p|div|tr|li|h\d)>/gi, "\n")
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

async function harvest(src, { checkOnly }) {
  if (src.blocked) return { ...src, status: "BLOCKED", detail: src.blocked };

  const outPath = join(OUT_DIR, `${src.state}_${src.key}.json`);
  const prior = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : null;

  let raw;
  try {
    raw = src.render
      ? await fetchRendered(src.url, src.startsWith)
      : await fetchPage(src.url);
  } catch (err) {
    return { ...src, status: "FETCH_FAILED", detail: err.message };
  }

  const isolated = isolate(htmlToText(raw), src);
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
  if (warnings.length >= 2) {
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
        retrievedAt: new Date().toISOString().slice(0, 10),
        hash,
        chars: text.length,
        // Non-empty means a hallmark of this statute type was not found; a human
        // must confirm the capture is the right section before drafting from it.
        warnings,
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
