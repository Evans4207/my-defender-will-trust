import type { ClauseProvenance } from "../clause-provenance";
import {
  SELF_PROVING_FORMS,
  type StatutoryForm,
} from "./generated/self-proving-forms";

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
  // Fill only the first blank run, which is the testator's name in every form we
  // have captured. Leaving the rest blank is deliberate.
  const withName = first.replace(/_{4,}/, ctx.testatorName);

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
const BY_STATE: Record<string, (ctx: SelfProvingContext) => SelfProvingClause> =
  Object.fromEntries(
    Object.entries(SELF_PROVING_FORMS).map(([state, form]) => [
      state,
      (ctx: SelfProvingContext) => fromStatutoryForm(state, ctx, form),
    ]),
  );

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
