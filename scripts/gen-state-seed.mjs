// Generates supabase/seed_states.sql for all 51 US jurisdictions.
//
// Sources:
//  - community_property: fixed law (AZ CA ID LA NV NM TX WA WI)
//  - excluded set: owner decision (LA/TX/NC/MO/OH high-risk, available=false)
//  - PER_STATE: statute-researched overrides (citations); everything else uses
//    conservative UPC-style defaults. All rows needs_review=true until counsel
//    QA sign-off (build plan §5 / Phase 6). Run: node scripts/gen-state-seed.mjs
import { writeFileSync } from "node:fs";

const CHECKED = "2026-07-12";

const JURISDICTIONS = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM",
  "NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA",
  "WV","WI","WY",
];

const COMMUNITY_PROPERTY = new Set(["AZ","CA","ID","LA","NV","NM","TX","WA","WI"]);

const EXCLUDED = {
  LA: "Excluded: civil-law jurisdiction, forced heirship, distinct notarial will forms.",
  TX: "Excluded pending counsel review (UPL enforcement history).",
  NC: "Excluded pending counsel review (UPL enforcement history).",
  MO: "Excluded pending counsel review (UPL enforcement history).",
  OH: "Excluded pending counsel review (UPL enforcement history).",
};

// Conservative defaults (UPC-style). Overridden per state below.
const DEFAULTS = {
  witnesses: 2,
  minAge: null,
  notarization: false,
  selfProving: { available: true, requiresNotary: true },
  signatureAtEnd: false,
  ewill: false,
  citations: {},
};

// Statute-researched overrides. Filled from the Phase 6 research pass; states
// not listed use DEFAULTS. `c` = citations by rule.
const PER_STATE = {
  TX: { minAge: 14, selfProving: { available: true, requiresNotary: true }, ewill: false,
    c: { witnesses: "Tex. Est. Code §251.051", selfProving: "Tex. Est. Code §251.101–.104" } },
  CA: { selfProving: { available: "uncertain", requiresNotary: false },
    c: { witnesses: "Cal. Prob. Code §6110", selfProving: "Cal. Prob. Code §8220" } },
  FL: { signatureAtEnd: true, selfProving: { available: true, requiresNotary: true }, ewill: true,
    c: { witnesses: "Fla. Stat. §732.502", selfProving: "Fla. Stat. §732.503", ewill: "Fla. Stat. §732.521+" } },
  NV: { selfProving: { available: true, requiresNotary: false }, ewill: true,
    c: { witnesses: "NRS §133.040", selfProving: "NRS §133.050", ewill: "NRS §133.085" } },
  AZ: { selfProving: { available: true, requiresNotary: true }, ewill: true,
    c: { witnesses: "ARS §14-2502", selfProving: "ARS §14-2504", ewill: "ARS §14-2518" } },
  // --- Phase 6.1 research (statute-verified, high confidence) ---
  SD: { c: { witnesses: "SDCL 29A-2-502", selfProving: "SDCL 29A-2-504" } },
  MT: { c: { witnesses: "Mont. Code Ann. §72-2-522", selfProving: "Mont. Code Ann. §72-2-524" } },
  KS: { signatureAtEnd: true, c: { witnesses: "K.S.A. 59-606", selfProving: "K.S.A. 59-606", signatureAtEnd: "K.S.A. 59-606 (signed at the end)" } },
  NE: { c: { witnesses: "Neb. Rev. Stat. §30-2327", selfProving: "Neb. Rev. Stat. §30-2329" } },
  CO: { ewill: true, c: { witnesses: "C.R.S. 15-11-502", selfProving: "C.R.S. 15-11-504", ewill: "C.R.S. 15-11-1301 to 1311 (CO UEWA)" } },
  UT: { ewill: true, c: { witnesses: "Utah Code §75-2-502", selfProving: "Utah Code §75-2-504", ewill: "Utah Code §§75-2-1401 to 1411 (UEWA)" } },
  WY: { c: { witnesses: "Wyo. Stat. §2-6-112", selfProving: "Wyo. Stat. §2-6-114" } },
  ME: { c: { witnesses: "18-C M.R.S. §2-502", selfProving: "18-C M.R.S. §2-503" } },
  NH: { c: { witnesses: "N.H. RSA 551:2", selfProving: "N.H. RSA 551:2-a" } },
  VT: { c: { witnesses: "14 V.S.A. §5 (2 witnesses since 2017)", selfProving: "14 V.S.A. §108" } },
  MA: { c: { witnesses: "Mass. G.L. c.190B §2-502", selfProving: "Mass. G.L. c.190B §2-504" } },
  RI: { c: { witnesses: "R.I. Gen. Laws §33-5-5", selfProving: "R.I. Gen. Laws §33-7-26" } },
  CT: { signatureAtEnd: true, c: { witnesses: "Conn. Gen. Stat. §45a-251", selfProving: "Conn. Gen. Stat. §45a-285", signatureAtEnd: "Conn. Gen. Stat. §45a-251 (subscribed)" } },
  NY: { signatureAtEnd: true, c: { witnesses: "N.Y. EPTL §3-2.1", selfProving: "N.Y. SCPA §1406", signatureAtEnd: "N.Y. EPTL §3-2.1 (at the end thereof)" } },
  NJ: { c: { witnesses: "N.J.S.A. 3B:3-2", selfProving: "N.J.S.A. 3B:3-4" } },
  PA: { signatureAtEnd: true, c: { witnesses: "20 Pa.C.S. §2502", selfProving: "20 Pa.C.S. §3132.1", signatureAtEnd: "20 Pa.C.S. §2502 (at the end)" } },
  DE: { c: { witnesses: "12 Del. C. §202", selfProving: "12 Del. C. §1305" } },
  MD: { selfProving: { available: true, requiresNotary: false }, ewill: true, c: { witnesses: "Md. Est. & Trusts §4-102", selfProving: "Md. Est. & Trusts §5-303 (attestation recital; no notary required)", ewill: "Md. Est. & Trusts §4-102 (2022 SB 36)" } },
  DC: { selfProving: { available: false, requiresNotary: false }, ewill: true, c: { witnesses: "D.C. Code §18-103", selfProving: "No self-proving affidavit statute for paper wills; e-wills only (§18-908)", ewill: "D.C. Code §§18-901 to 18-911 (2022 UEWA)" } },
  VA: { c: { witnesses: "Va. Code §64.2-403", selfProving: "Va. Code §64.2-452" } },
  WV: { c: { witnesses: "W. Va. Code §41-1-3", selfProving: "W. Va. Code §41-5-15" } },
  NC: { ewill: true, c: { witnesses: "N.C. Gen. Stat. §31-3.3", selfProving: "N.C. Gen. Stat. §31-11.6", ewill: "N.C. Gen. Stat. Ch.31 Art.11 (UEWA, eff. 2025)" } },
  SC: { c: { witnesses: "S.C. Code §62-2-502", selfProving: "S.C. Code §62-2-503" } },
  GA: { minAge: 14, c: { witnesses: "O.C.G.A. §53-4-20", minAge: "O.C.G.A. §53-4-22 (age 14)", selfProving: "O.C.G.A. §53-4-24" } },
  AL: { c: { witnesses: "Ala. Code §43-8-131", selfProving: "Ala. Code §43-8-132" } },
  MS: { c: { witnesses: "Miss. Code §91-5-1", selfProving: "Miss. Code §91-7-7/§91-7-9" } },
  TN: { c: { witnesses: "Tenn. Code §32-1-104", selfProving: "Tenn. Code §32-2-110" } },
  KY: { signatureAtEnd: true, c: { witnesses: "KRS 394.040", selfProving: "KRS 394.225", signatureAtEnd: "KRS 394.040 (signed at the end)" } },
  AR: { signatureAtEnd: true, c: { witnesses: "Ark. Code §28-25-103", selfProving: "Ark. Code §28-25-106", signatureAtEnd: "Ark. Code §28-25-103 (at the end)" } },
  OK: { signatureAtEnd: true, ewill: true, c: { witnesses: "84 O.S. §55", selfProving: "84 O.S. §55", signatureAtEnd: "84 O.S. §55 (at the end)", ewill: "OK UEWA (eff. 11/1/2024)" } },
  MO: { ewill: true, c: { witnesses: "RSMo §474.320", selfProving: "RSMo §474.337", ewill: "MO UEWA (eff. 8/28/2025)" } },
  OH: { minAge: 18, signatureAtEnd: true, selfProving: { available: false, requiresNotary: false }, c: { witnesses: "Ohio Rev. Code §2107.03", minAge: "Ohio Rev. Code §2107.06 (age 18)", selfProving: "No self-proving affidavit statute in Ohio", signatureAtEnd: "Ohio Rev. Code §2107.03 (at the end)" } },
  MI: { c: { witnesses: "Mich. Comp. Laws §700.2502", selfProving: "Mich. Comp. Laws §700.2504" } },
  IN: { selfProving: { available: true, requiresNotary: false }, ewill: true, c: { witnesses: "Ind. Code §29-1-5-3", selfProving: "Ind. Code §29-1-5-3.1 (unsworn, under penalties for perjury)", ewill: "Ind. Code ch. 29-1-21 (2018)" } },
  IL: { selfProving: { available: true, requiresNotary: false }, ewill: true, c: { witnesses: "755 ILCS 5/4-3", selfProving: "755 ILCS 5/6-4 (attestation clause/affidavit, no notary)", ewill: "755 ILCS 6/ (2021)" } },
  WI: { c: { witnesses: "Wis. Stat. §853.03", selfProving: "Wis. Stat. §853.04" } },
  MN: { c: { witnesses: "Minn. Stat. §524.2-502", selfProving: "Minn. Stat. §524.2-504" } },
  IA: { c: { witnesses: "Iowa Code §633.279", selfProving: "Iowa Code §633.279(2)" } },
  ND: { ewill: true, c: { witnesses: "N.D. Cent. Code §30.1-08-02", selfProving: "N.D. Cent. Code §30.1-08-03", ewill: "N.D. Cent. Code ch. 30.1-37 (UEWA, 2021)" } },
  ID: { minAge: 18, c: { witnesses: "Idaho Code §15-2-502", minAge: "Idaho Code §15-2-505 (age 18)", selfProving: "Idaho Code §15-2-504" } },
  NM: { c: { witnesses: "N.M. Stat. §45-2-502", selfProving: "N.M. Stat. §45-2-504" } },
  OR: { c: { witnesses: "ORS 112.235", selfProving: "ORS 113.055", ewill: "ORS 112.235(3) excludes electronic records (no e-wills)" } },
  WA: { ewill: true, c: { witnesses: "RCW 11.12.020", selfProving: "RCW 11.20.020(2)", ewill: "RCW 11.12.400–491 (UEWA, eff. 2022)" } },
  HI: { c: { witnesses: "Haw. Rev. Stat. §560:2-502", selfProving: "Haw. Rev. Stat. §560:2-504" } },
  AK: { ewill: true, c: { witnesses: "AS 13.12.502", selfProving: "AS 13.12.504", ewill: "AS 13.12 electronic-will provisions (SB 90)" } },
  LA: { minAge: 16, notarization: true, selfProving: { available: true, requiresNotary: true }, signatureAtEnd: false,
    c: { witnesses: "La. Civ. Code art. 1576 (notary + 2 witnesses)", minAge: "La. Civ. Code art. 1581 (age 16)", notarization: "La. Civ. Code art. 1576 (notarial testament requires a notary)", selfProving: "La. Civ. Code art. 1576 (self-authenticating notarial testament)", signatureAtEnd: "Acts 2025 No. 30 (SB 49): signature may appear anywhere" } },
};

function ruleRows(code) {
  const o = { ...DEFAULTS, ...(PER_STATE[code] ?? {}) };
  const c = o.c ?? {};
  const cp = COMMUNITY_PROPERTY.has(code);
  const cite = (k, fallback) => (c[k] ? c[k] : fallback);
  // [doc_type, rule_key, value, citation]
  return [
    ["will", "witnesses_required", { count: o.witnesses }, cite("witnesses", "Baseline (2 witnesses) — verify statute")],
    ["will", "witness_min_age", { age: o.minAge }, cite("minAge", "Baseline — verify competency/age statute")],
    [null, "notarization_required_for_document", { required: o.notarization }, cite("notarization", o.notarization ? "Notarization required — verify" : "Attested will valid without notarization — verify")],
    ["will", "self_proving_affidavit", { available: o.selfProving.available, requires_notary: o.selfProving.requiresNotary }, cite("selfProving", "Baseline self-proving affidavit — verify statute")],
    ["will", "signature_at_end_required", { required: o.signatureAtEnd }, cite("signatureAtEnd", "Baseline — verify")],
    ["will", "electronic_will_permitted", { permitted: o.ewill, mvp_position: "wet_signature" }, cite("ewill", o.ewill ? "E-will permitted — verify" : "No e-will statute found — verify")],
    [null, "community_property", { community_property: cp }, cp ? "Community property state (fixed law)" : "Common-law (separate property) state"],
  ];
}

const PILOT = new Set(["TX", "CA", "FL", "NV", "AZ"]);

function sqlStr(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

let out = `-- GENERATED by scripts/gen-state-seed.mjs — do not edit by hand.
-- ⚠️ [ATTORNEY REVIEW REQUIRED] Baseline execution formalities for all 51 US
-- jurisdictions. Every row needs_review=true pending counsel QA sign-off.
-- Community property = fixed law; other values are UPC-style defaults refined by
-- statute research (citations recorded where verified). Idempotent.

`;

for (const code of JURISDICTIONS) {
  const rows = ruleRows(code);
  // Pilot states keep needs_review from their dedicated seed; new states are all
  // needs_review=true until counsel QA.
  const needsReview = true;
  out += `-- ${code}\n`;
  out += `insert into public.state_rules (state_code, doc_type, rule_key, rule_value, citation, checked_at, needs_review) values\n`;
  out += rows
    .map(([docType, key, val, citation]) => {
      const dt = docType === null ? "null" : sqlStr(docType);
      return `  (${sqlStr(code)}, ${dt}, ${sqlStr(key)}, ${sqlStr(JSON.stringify(val))}::jsonb, ${sqlStr(citation)}, ${sqlStr(CHECKED)}, ${needsReview})`;
    })
    .join(",\n");
  out += `\non conflict (state_code, rule_key, coalesce(doc_type::text, '*')) do update set rule_value = excluded.rule_value, citation = excluded.citation, checked_at = excluded.checked_at, needs_review = excluded.needs_review, updated_at = now();\n\n`;
}

// Availability: all available except the excluded high-risk set.
out += `-- State availability (all available except high-risk excluded set)\n`;
out += `insert into public.state_availability (state_code, available, reason) values\n`;
out += JURISDICTIONS.map((code) => {
  const excluded = code in EXCLUDED;
  const reason = excluded ? sqlStr(EXCLUDED[code]) : "null";
  return `  (${sqlStr(code)}, ${excluded ? "false" : "true"}, ${reason})`;
}).join(",\n");
out += `\non conflict (state_code) do update set available = excluded.available, reason = excluded.reason, updated_at = now();\n`;

void PILOT;
writeFileSync(new URL("../supabase/seed.sql", import.meta.url), out);
console.log("Wrote supabase/seed.sql for", JURISDICTIONS.length, "jurisdictions.");
