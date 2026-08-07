import type { ClauseProvenance } from "../clause-provenance";
import {
  SELF_PROVING_FORMS,
  type StatutoryForm,
} from "./generated/self-proving-forms";
import { DRAFTED_FORMS, type DraftedForm } from "./drafted-forms";

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
 * Build a clause from a state's own prescribed statutory form.
 *
 * The text is generated verbatim from the captured statute (see
 * scripts/gen-self-proving-forms.mjs), so per-state wording differences are
 * carried through rather than modelled. An earlier pass templated these with
 * "variant" flags and kept discovering more of them — "as my will" vs "as my last
 * will", "therein expressed" vs "expressed in it", South Carolina's
 * under-eighteen-if-married clause, Maine's emancipated-minor clause. For a
 * prescribed form the compliant text simply IS the statute's text.
 *
 * The one substitution is the testator's name into the form's first blank. Every
 * other blank stays as the statute prints it — those are filled in by hand at
 * signing by the testator, the witnesses and the notary.
 */
function fromStatutoryForm(
  state: string,
  ctx: SelfProvingContext,
  form: StatutoryForm,
): SelfProvingClause {
  const [first, ...rest] = form.paragraphs;

  // Fill the testator's name, but ONLY into the blank that follows "I,". Several
  // forms open with the officer's venue block ("STATE OF ____ COUNTY OF ____"),
  // and blindly filling the first blank puts the testator's name in the county
  // line. Where no "I, ____" pattern exists we leave every blank alone, which is
  // always safe: the signer completes them by hand.
  const withName = first.replace(/(\bI,\s*)_{4,}/, `$1${ctx.testatorName}`);

  return {
    paragraphs: [withName, ...rest],
    signatureLines: [
      `Testator: ${ctx.testatorName}`,
      ...Array.from(
        { length: ctx.witnessCount },
        (_, i) => `Witness ${i + 1} — signature / printed name / address`,
      ),
      ...(ctx.requiresNotary
        ? [
            "(Signed) ____________________  (Official capacity of officer)",
            "My commission expires: ____________",
            "(Official seal)",
          ]
        : []),
    ],
    provenance: {
      citation: form.citation,
      sourceUrl: form.sourceUrl,
      checkedAt: form.retrievedAt,
      status: "researched",
      fidelity: "statutory_sample",
      reviewNote:
        `Reproduced from the ${form.citation} statutory form as published by the ` +
        `state, retrieved ${form.retrievedAt}. Only the testator's name is filled in; ` +
        `the remaining blanks are completed at signing. Please confirm: (1) the ` +
        `statutory text is unchanged as of your review; (2) this is the correct form ` +
        `for a simultaneously-executed self-proved will in ${state}; and (3) whether ` +
        `the after-the-fact ("two-step") variant, where the statute offers one, should ` +
        `also be made available.`,
    },
  };
}

/**
 * Build a clause for a state that prescribes NO form, from the rule its statute
 * lays down. See `drafted-forms.ts` — this text is written by us, not reproduced,
 * and stays flagged for counsel.
 *
 * Kept structurally separate from `fromStatutoryForm` on purpose: the two carry
 * different fidelity, different review questions and a different safety net, and
 * collapsing them would make a drafted clause look like a reproduced one in the
 * provenance line that goes to counsel.
 */
function fromDraftedForm(
  state: string,
  ctx: SelfProvingContext,
  form: DraftedForm,
): SelfProvingClause {
  const [venue, opening, ...rest] = form.paragraphs;

  // Same rule as the statutory forms: fill only the testator's name, and only
  // where the draft marks it. Every other blank is completed at signing.
  const withName = opening.replace(/_{4,}/, ctx.testatorName);

  const elements = form.requirements
    .map((r) => `• ${r.source} — ${r.element}`)
    .join("\n");
  const caveats = form.caveats.length
    ? `\n\nSTATUTORY LIMITS:\n${form.caveats.map((c) => `• ${c}`).join("\n")}`
    : "";
  const questions = form.counselQuestions.map((q) => `• ${q}`).join("\n");

  return {
    paragraphs: [venue, withName, ...rest],
    signatureLines: [
      // Where the statute makes the testator an affiant too (Vermont), the
      // testator signs first — the affidavit is theirs as much as the witnesses'.
      ...(form.affiants === "testator_and_witnesses"
        ? [`Testator: ${ctx.testatorName}`]
        : []),
      ...Array.from(
        { length: ctx.witnessCount },
        (_, i) => `Witness ${i + 1} — signature / printed name / address`,
      ),
      ...(form.requiresNotary
        ? [
            "Subscribed and sworn to before me this ______ day of ____________, 20____.",
            "(Signed) ____________________  (Official capacity of officer)",
            "My commission expires: ____________",
            "(Official seal)",
          ]
        : []),
    ],
    provenance: {
      citation: form.citation,
      sourceUrl: form.sourceUrl,
      checkedAt: form.checkedAt,
      // "researched" is accurate — we read and cited the governing statute. The
      // fidelity flag, not the status, is what says the words are ours.
      status: "researched",
      fidelity: "drafted_from_rule",
      reviewNote:
        `[ATTORNEY REVIEW REQUIRED] ${state} prescribes NO statutory form for a ` +
        `self-proving affidavit, so this text is DRAFTED BY A NON-LAWYER from ` +
        `${form.citation} (read ${form.checkedAt}) — it is not reproduced from any ` +
        `statute and no part of it is authoritative. It is offered as a starting ` +
        `point to redline.\n\nELEMENTS THE STATUTE REQUIRES (an automated test ` +
        `confirms the draft covers each; that proves coverage, NOT ` +
        `sufficiency):\n${elements}${caveats}\n\nPLEASE DECIDE:\n${questions}`,
    },
  };
}

/**
 * Jurisdictions where the threshold question is whether a paper-will self-proving
 * mechanism EXISTS — not what it should say.
 *
 * Drafting an affidavit for these would invent a procedure the legislature did
 * not create, and would read to counsel as though we had found authority we have
 * not. So they keep a conservative clause and carry the real question instead.
 */
const NO_KNOWN_MECHANISM: Record<
  string,
  { citation: string; sourceUrl: string; checkedAt: string; finding: string }
> = {
  MD: {
    citation: "Md. Code, Est. & Trusts § 4-102",
    sourceUrl:
      "https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=get&section=4-102&enactments=false",
    checkedAt: "2026-08-05",
    finding:
      "§ 4-102 prescribes attestation and certification requirements only inside " +
      "its electronic-will and remotely-witnessed-will subsections (c) and (d). We " +
      "found no provision creating a self-proving affidavit for an ordinary paper, " +
      "wet-signature will executed in physical presence under (b).",
  },
  DC: {
    citation: "D.C. Code § 18-908",
    sourceUrl: "https://code.dccouncil.gov/us/dc/council/code/sections/18-908",
    checkedAt: "2026-08-05",
    finding:
      "§ 18-908 is the District's Uniform Electronic Wills Act provision — it " +
      "prescribes an affidavit form for an ELECTRONIC will attested by an " +
      "electronic signature. We found no provision creating a self-proving " +
      "affidavit for an ordinary paper, wet-signature will.",
  },
  OH: {
    citation: "Ohio Rev. Code § 2107.18",
    sourceUrl: "https://codes.ohio.gov/ohio-revised-code/section-2107.18",
    checkedAt: "2026-08-05",
    finding:
      "ORC chapter 2107 contains no 'affidavit' or 'self-proving' provision at " +
      "all. § 2107.18 admits a will to probate if due execution 'appears from the " +
      "face of the will', with witness testimony only at the court's discretion — " +
      "so Ohio appears to reach the same result through the attestation clause " +
      "rather than through a sworn affidavit.",
  },
};

function fromNoKnownMechanism(
  state: string,
  ctx: SelfProvingContext,
): SelfProvingClause {
  const f = NO_KNOWN_MECHANISM[state];
  const base = genericPlaceholder(ctx);
  return {
    ...base,
    provenance: {
      citation: f.citation,
      sourceUrl: f.sourceUrl,
      checkedAt: f.checkedAt,
      status: "researched",
      fidelity: "drafted_from_rule",
      reviewNote:
        `[ATTORNEY REVIEW REQUIRED] THRESHOLD QUESTION — does ${state} have a ` +
        `self-proving mechanism for a PAPER will at all?\n\nFINDING: ${f.finding}\n\n` +
        `We have deliberately NOT drafted an affidavit for ${state}: doing so would ` +
        `invent a procedure the legislature does not appear to have created. The ` +
        `conservative clause below ships only so the document is not silent.\n\n` +
        `PLEASE DECIDE: (1) Is that reading correct? (2) If there is no such ` +
        `mechanism, should ${state} documents carry a strengthened attestation ` +
        `clause and no affidavit? (3) If an affidavit is customary in practice ` +
        `notwithstanding the absence of a statute, please supply the wording.`,
    },
  };
}

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

/**
 * States whose prescribed form we have captured and can reproduce. Everything
 * else falls through to the conservative placeholder below.
 */
const BY_STATE: Record<string, (ctx: SelfProvingContext) => SelfProvingClause> = {
  // Tier 1 — the state's own prescribed form, reproduced verbatim.
  ...Object.fromEntries(
    Object.entries(SELF_PROVING_FORMS).map(([state, form]) => [
      state,
      (ctx: SelfProvingContext) => fromStatutoryForm(state, ctx, form),
    ]),
  ),
  // Tier 2 — no prescribed form; drafted from the statute's own rule.
  ...Object.fromEntries(
    Object.entries(DRAFTED_FORMS).map(([state, form]) => [
      state,
      (ctx: SelfProvingContext) => fromDraftedForm(state, ctx, form),
    ]),
  ),
  // Tier 3 — no paper-will mechanism found; carries the threshold question.
  ...Object.fromEntries(
    Object.keys(NO_KNOWN_MECHANISM).map((state) => [
      state,
      (ctx: SelfProvingContext) => fromNoKnownMechanism(state, ctx),
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

/** State codes with researched (not placeholder) self-proving text — all tiers. */
export function researchedStates(): string[] {
  return Object.keys(BY_STATE);
}

/**
 * State codes whose text is reproduced VERBATIM from a prescribed statutory form.
 *
 * Kept separate from `researchedStates()` because the verbatim test can only be
 * applied to these: it asserts our wording appears in the source statute, which
 * is meaningless for a state that prescribes no form and impossible for one that
 * has no mechanism at all. Pointing that test at every researched state would
 * either fail honestly (as it did when the drafted tier landed) or, worse, get
 * "fixed" by loosening it until it proved nothing.
 */
export function verbatimStates(): string[] {
  return Object.keys(SELF_PROVING_FORMS);
}

/** State codes whose text is drafted from the rule because no form is prescribed. */
export function draftedFromRuleStates(): string[] {
  return Object.keys(DRAFTED_FORMS);
}

/** Jurisdictions where no paper-will self-proving mechanism was found at all. */
export function noKnownMechanismStates(): string[] {
  return Object.keys(NO_KNOWN_MECHANISM);
}
