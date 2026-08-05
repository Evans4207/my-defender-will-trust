import type { ClauseProvenance } from "../clause-provenance";

/**
 * Self-proving affidavit — researched clause set.
 *
 * Nine states are drafted from their own statute with a citation: Arizona plus
 * the Uniform Probate Code § 2-504 family (ID, MN, MT, NE, SC, SD, UT). Every
 * other state falls through to the conservative placeholder until researched the
 * same way, so the fallback below is deliberate and must stay.
 *
 * Drafts are cross-checked against the captured statutes in docs/statutes by
 * `self-proving-affidavit.statutes.test.ts`, so text that drifts from its source
 * fails the build rather than reaching a customer's document.
 *
 * WHY THIS CLAUSE FIRST
 * ---------------------
 * The self-proving affidavit is the highest-value clause to get right: it is the
 * one part of a will whose wording is prescribed by statute in most states, and
 * getting it wrong costs the estate a probate step (the witnesses must be tracked
 * down and made to testify) even though the will itself is otherwise valid.
 *
 * DRAFTING RULE
 * -------------
 * Where a state's statute prescribes a MANDATORY form, we reproduce the statute
 * verbatim — we do not paraphrase prescribed language. Where the statute gives a
 * sample form on a "substantially the following form" standard (Arizona), we
 * track the statutory form's required elements closely. The distinction is
 * recorded per state in `fidelity`.
 */

export type SelfProvingClause = {
  /** Paragraphs of the affidavit body, in order. */
  paragraphs: string[];
  /** Signature/notary block lines to render beneath the body. */
  signatureLines: string[];
  provenance: ClauseProvenance;
};

export type SelfProvingContext = {
  testatorName: string;
  stateName: string;
  /** Number of witnesses this state requires. */
  witnessCount: number;
  /**
   * Whether this state's self-proving affidavit must be sworn before a notary.
   * Drives the unresearched fallback's sworn-vs-unsworn wording, which is the
   * one execution distinction we can make safely without state-specific research.
   */
  requiresNotary: boolean;
};

/**
 * ARIZONA — A.R.S. § 14-2504.
 *
 * Section heading: "Self-proved wills; sample form; signature requirements".
 *
 * Two findings from the statute drive this draft:
 *
 *  1. Subsection (A) requires the officer's certificate to be "in substantially
 *     the following form" — so Arizona applies a SUBSTANTIAL-COMPLIANCE standard
 *     and the sample form need not be reproduced word for word. Text that tracks
 *     the statutory elements is the right target; counsel confirms sufficiency.
 *
 *  2. The witnesses' affidavit must establish six facts. All six are carried
 *     below, and each is annotated so counsel can check them off against the
 *     statute quickly:
 *       (a) the testator signed and executed the instrument as their will;
 *       (b) the testator signed willingly, or willingly directed another to sign;
 *       (c) each witness signed in the testator's presence and hearing;
 *       (d) the testator is eighteen years of age or older;
 *       (e) the testator is of sound mind; and
 *       (f) the testator is under no constraint or undue influence.
 *
 * Subsection (B) additionally permits an attested will to be made self-proved at
 * any time AFTER execution; we generate the simultaneous-execution form only,
 * which is the common case. Subsection (C) provides that a signature on the
 * affidavit counts as a signature on the will where needed to prove due
 * execution — noted for counsel, no drafting consequence here.
 *
 * Arizona requires the officer's certificate under official seal, so the
 * signature block carries a seal line.
 */
function arizona(ctx: SelfProvingContext): SelfProvingClause {
  const witnessWord = ctx.witnessCount === 2 ? "two (2)" : String(ctx.witnessCount);

  return {
    paragraphs: [
      // Testator's sworn declaration — tracks the statutory testator paragraph.
      `I, ${ctx.testatorName}, the testator, sign my name to this instrument this ____ day of ____________, 20____, and being first duly sworn, do declare to the undersigned authority that I sign and execute this instrument as my will, that I sign it willingly (or willingly direct another to sign for me), that I execute it as my free and voluntary act for the purposes expressed in that document, and that I am eighteen years of age or older, of sound mind, and under no constraint or undue influence.`,

      // Witnesses' sworn declaration — carries all six statutory facts (a)–(f).
      `We, the undersigned ${witnessWord} witnesses, sign our names to this instrument and, being first duly sworn, do declare to the undersigned authority that the testator signs and executes this instrument as the testator's will, that the testator signs it willingly (or willingly directs another to sign for the testator), that each of us, in the presence and hearing of the testator, signs this will as witness to the testator's signing, and that to the best of our knowledge the testator is eighteen years of age or older, of sound mind, and under no constraint or undue influence.`,

      // Officer's certificate — "substantially the following form" per § 14-2504(A).
      // The statutory form opens with a venue block; omitting it is a defect a
      // notary would catch, so it is reproduced here.
      `The State of ____________________  County of ____________________`,
      `Subscribed, sworn to and acknowledged before me by ${ctx.testatorName}, the testator, and subscribed and sworn to before me by the witnesses named above, this ____ day of ____________, 20____.`,
    ],
    signatureLines: [
      `Testator: ${ctx.testatorName}`,
      ...Array.from(
        { length: ctx.witnessCount },
        (_, i) => `Witness ${i + 1} — signature / printed name / address`,
      ),
      "(Signed) ____________________  (Official capacity of officer)",
      "My commission expires: ____________",
      "(Official seal)",
    ],
    provenance: {
      citation: "A.R.S. § 14-2504(A)",
      sourceUrl: "https://www.azleg.gov/ars/14/02504.htm",
      checkedAt: "2026-08-05",
      status: "researched",
      fidelity: "statutory_sample",
      reviewNote:
        "Drafted to track the § 14-2504(A) sample form, which applies a " +
        "'substantially the following form' standard rather than requiring verbatim " +
        "text. Please confirm: (1) the current statutory text is unchanged as of your " +
        "review; (2) the witnesses' paragraph adequately establishes all six facts the " +
        "statute enumerates; (3) whether you want the § 14-2504(B) after-the-fact " +
        "self-proving variant offered as well; and (4) the notary block and seal line " +
        "satisfy Arizona practice.",
    },
  };
}

/**
 * The Uniform Probate Code § 2-504 family.
 *
 * Most states that prescribe a self-proving affidavit adopted the UPC form, so
 * the paragraphs below share one skeleton. The wording is NOT identical between
 * them, though, and the differences are substantive enough to matter:
 *
 *   - "as my will" vs "as my last will"
 *   - "do declare" vs "do hereby declare"
 *   - whether the date line carries an explicit "20___" year field
 *
 * Each adopting state therefore declares its own variant and cites its own
 * statute. `self-proving-affidavit.statutes.test.ts` cross-checks the text this
 * produces against that state's captured statute in docs/statutes, so a wrong
 * variant fails the build rather than reaching a customer's document.
 */
type UpcVariant = {
  /** "as my last will" (true) vs "as my will" (false). */
  lastWill: boolean;
  /** "do hereby declare" (true) vs "do declare" (false). */
  hereby: boolean;
  /** Date line carries an explicit year field. */
  yearField: boolean;
  /**
   * How the statute writes the age of capacity. Three spellings are in use and
   * they are not interchangeable if we want to track the printed form.
   */
  age: "eighteen" | "18" | "eighteen (18)";
};

function upcFamily(
  ctx: SelfProvingContext,
  v: UpcVariant,
  provenance: ClauseProvenance,
): SelfProvingClause {
  const declare = v.hereby ? "do hereby declare" : "do declare";
  const willWord = v.lastWill ? "last will" : "will";
  const date = v.yearField
    ? "this ____ day of ____________, 20____"
    : "this ____ day of ____________";
  const age = `${v.age} years of age or older`;

  return {
    paragraphs: [
      // Testator's sworn declaration.
      `I, ${ctx.testatorName}, the testator, sign my name to this instrument ${date}, and being first duly sworn, ${declare} to the undersigned authority that I sign and execute this instrument as my ${willWord} and that I sign it willingly (or willingly direct another to sign for me), that I execute it as my free and voluntary act for the purposes expressed in that document, and that I am ${age}, of sound mind, and under no constraint or undue influence.`,

      // Witnesses' sworn declaration. The statutory form uses bracketed
      // [his]/[her] alternates; we render the neutral "the testator's" instead,
      // which is a departure from the printed form and is called out for counsel.
      `We, the undersigned witnesses, sign our names to this instrument, being first duly sworn, and ${declare} to the undersigned authority that the testator signs and executes this instrument as the testator's ${willWord} and that the testator signs it willingly (or willingly directs another to sign for the testator), that the testator executes it as the testator's free and voluntary act for the purposes therein expressed, and that each of us, in the presence and hearing of the testator, hereby signs this will as witness to the testator's signing, and that to the best of our knowledge the testator is ${age}, of sound mind, and under no constraint or undue influence.`,

      // Officer's certificate, including the venue block the statutory forms open with.
      `The State of ____________________  County of ____________________`,
      `Subscribed, sworn to and acknowledged before me by ${ctx.testatorName}, the testator, and subscribed and sworn to before me by the witnesses named above, ${date}.`,
    ],
    signatureLines: [
      `Testator: ${ctx.testatorName}`,
      ...Array.from(
        { length: ctx.witnessCount },
        (_, i) => `Witness ${i + 1} — signature / printed name / address`,
      ),
      "(Signed) ____________________  (Official capacity of officer)",
      "My commission expires: ____________",
      "(Official seal)",
    ],
    provenance,
  };
}

/** Shared review note for the UPC-family states, with the state's own citation. */
function upcReviewNote(citation: string, formStandard: string): string {
  return (
    `Drafted to track the ${citation} statutory form, which the statute requires ` +
    `${formStandard}. Please confirm: (1) the current statutory text is unchanged as ` +
    `of your review; (2) the witnesses' paragraph adequately establishes every fact ` +
    `the statute enumerates; and (3) that rendering the printed form's bracketed ` +
    `[his]/[her] alternates as the gender-neutral "the testator's" is acceptable in ` +
    `this state, or supply the wording you want instead.`
  );
}

/**
 * Per-state UPC variants, each verified against that state's captured statute.
 * Variant flags were derived by comparing the captured texts — see
 * docs/STATUTE_SOURCES.md.
 */
// NOTE: Wisconsin (§ 853.04) is deliberately NOT in this table. Its statutory
// form is structurally different — a numbered list of declarations, "conscious
// presence" rather than "presence and hearing" — so it needs its own drafting
// rather than a UPC variant. Caught by the statute cross-check test.
const UPC_STATES: Record<
  string,
  { citation: string; sourceUrl: string; standard: string; variant: UpcVariant }
> = {
  ID: {
    citation: "Idaho Code § 15-2-504",
    sourceUrl: "https://legislature.idaho.gov/statutesrules/idstat/Title15/T15CH2/SECT15-2-504/",
    standard: "to be 'substantially as follows'",
    variant: { lastWill: true, hereby: true, yearField: false , age: "eighteen (18)" },
  },
  MN: {
    citation: "Minn. Stat. § 524.2-504",
    sourceUrl: "https://www.revisor.mn.gov/statutes/cite/524.2-504",
    standard: "to be 'substantially the following form'",
    variant: { lastWill: false, hereby: true, yearField: false , age: "18" },
  },
  MT: {
    citation: "Mont. Code Ann. § 72-2-524",
    sourceUrl:
      "https://archive.legmt.gov/bills/mca/title_0720/chapter_0020/part_0050/section_0240/0720-0020-0050-0240.html",
    standard: "to be 'substantially the following form'",
    variant: { lastWill: false, hereby: true, yearField: true , age: "18" },
  },
  NE: {
    citation: "Neb. Rev. Stat. § 30-2329",
    sourceUrl: "https://nebraskalegislature.gov/laws/statutes.php?statute=30-2329",
    standard: "to be 'substantially as follows'",
    variant: { lastWill: true, hereby: true, yearField: true , age: "eighteen" },
  },
  SC: {
    citation: "S.C. Code § 62-2-503",
    sourceUrl: "https://www.scstatehouse.gov/code/t62c002.php",
    standard: "to follow the statutory form (or one showing the same intent)",
    variant: { lastWill: true, hereby: true, yearField: true , age: "eighteen" },
  },
  SD: {
    citation: "SDCL § 29A-2-504",
    sourceUrl: "https://sdlegislature.gov/Statutes/29A-2-504",
    standard: "to be 'substantially the following form'",
    variant: { lastWill: false, hereby: true, yearField: false , age: "eighteen" },
  },
  UT: {
    citation: "Utah Code § 75-2-504",
    sourceUrl: "https://le.utah.gov/xcode/Title75/Chapter2/75-2-S504.html",
    standard: "to be 'substantially the following form'",
    variant: { lastWill: false, hereby: true, yearField: false , age: "18" },
  },
};

/**
 * Generic fallback for every state not yet researched. Deliberately conservative:
 * it does NOT attempt statutory language, and it stays flagged as placeholder so
 * nothing implies a compliance claim we have not done the work to support.
 */
function genericPlaceholder(ctx: SelfProvingContext): SelfProvingClause {
  return {
    paragraphs: [
      // Sworn-before-a-notary vs. unsworn declaration is driven by the state's
      // own rule row, so the fallback can make that distinction without pretending
      // to know the state's prescribed wording.
      ctx.requiresNotary
        ? `We, the testator and the undersigned witnesses, being sworn before a notary public, declare that this will was signed and attested as required by the law of ${ctx.stateName}.`
        : `We, the undersigned witnesses, declare under penalty of perjury that this will was signed and attested as required by the law of ${ctx.stateName}.`,
    ],
    signatureLines: [
      `Testator: ${ctx.testatorName}`,
      ...Array.from(
        { length: ctx.witnessCount },
        (_, i) => `Witness ${i + 1} — signature / printed name / address`,
      ),
      ...(ctx.requiresNotary ? ["Notary Public"] : []),
    ],
    provenance: {
      citation: "—",
      checkedAt: "—",
      status: "placeholder",
      fidelity: "drafted_from_rule",
      reviewNote:
        "PLACEHOLDER — not drafted against this state's statute. Supply the " +
        "state's self-proving affidavit language, and confirm whether that state " +
        "prescribes a mandatory form or applies a substantial-compliance standard.",
    },
  };
}

/** Researched clauses by state code. Grows one state at a time, each cited. */
const BY_STATE: Record<string, (ctx: SelfProvingContext) => SelfProvingClause> = {
  AZ: arizona,
  ...Object.fromEntries(
    Object.entries(UPC_STATES).map(([state, s]) => [
      state,
      (ctx: SelfProvingContext) =>
        upcFamily(ctx, s.variant, {
          citation: s.citation,
          sourceUrl: s.sourceUrl,
          checkedAt: "2026-08-05",
          status: "researched",
          fidelity: "statutory_sample",
          reviewNote: upcReviewNote(s.citation, s.standard),
        }),
    ]),
  ),
};

/**
 * Resolve the self-proving affidavit for a state. Data-driven lookup — no
 * hardcoded state branching in the assemblers (CLAUDE.md rule 3).
 */
export function selfProvingAffidavitFor(
  stateCode: string,
  ctx: SelfProvingContext,
): SelfProvingClause {
  return (BY_STATE[stateCode] ?? genericPlaceholder)(ctx);
}

/** State codes with researched (not placeholder) self-proving text. */
export function researchedStates(): string[] {
  return Object.keys(BY_STATE);
}
