/**
 * Execution blocks — the signature / witness / notary lines printed at the foot
 * of a generated document.
 *
 * WHY THIS MODULE EXISTS
 * ----------------------
 * Execution formalities are set state by state, and the platform is data-driven
 * (Instructions #5): an assembler must never branch on a state code, and must
 * never assert a formality the rules layer does not record.
 *
 * Before this module, only `assembleWill` honoured that. Every other assembler
 * hardcoded its block — the trust printed "Notary Public" in all 51
 * jurisdictions, the POA did the same, the healthcare directive always printed
 * exactly two witness lines, and the pour-over will printed no notary line and
 * no self-proving affidavit anywhere. Those blocks are assertions about a
 * state's law, and they were made without data behind them.
 *
 * So this module splits documents in two, and does it PER STATE:
 *
 *   - Where `state_rules` holds rows for this (state, instrument), the block is
 *     derived from them, exactly as `assembleWill` always did.
 *   - Where it does not, the document FAILS CLOSED: it prints the roles that are
 *     universal (the signer, the date) and an explicit attorney-review line in
 *     place of the witness and notary lines, rather than guessing them.
 *
 * Fail-closed is deliberate. A document that prints "Notary Public" in a state
 * requiring no notary is making a false statement about that state's law; a
 * document that says the requirement has not been established is making a true
 * one. Adding counsel-approved rows for a state flips that state on its own —
 * there is no list in this file to remember to update.
 *
 * ⚠️ Nothing in this module drafts legal language. It emits blank lines to sign
 * on and review markers — never clause text, affidavit wording or statutory
 * text.
 */

import { ATTORNEY_REVIEW_REQUIRED } from "@/lib/legal";
import { needsAttorneyReview } from "./clause-provenance";
import { selfProvingAffidavitFor } from "./clauses/self-proving-affidavit";
import type { DocSection, DocumentKind } from "./model";
import type { ExecutionOption, StateRuleset } from "./state-rules";

/**
 * Whether this document's execution formalities are actually recorded for this
 * state, and may therefore be printed.
 *
 * This used to be a hardcoded set of kinds — `will` and `pourover` in, everything
 * else out — which forced an all-or-nothing choice per instrument: a POA could
 * only stop failing closed once rows existed for all 51 jurisdictions at once.
 * Research does not arrive that way. It arrives one state at a time, and the
 * dossier already holds POA findings for four states with nothing for the other
 * forty-seven.
 *
 * So the question is answered from the data, per state AND per instrument. A
 * state with rows prints its rules; a state without keeps failing closed; and a
 * state flips the moment counsel-approved rows land, with no code change and no
 * chance of the flip being applied too widely by hand.
 */
export function hasRecordedExecutionRules(ruleset: StateRuleset): boolean {
  return ruleset.hasRecordedRules;
}

/**
 * Execution block for a non-testamentary instrument whose rules ARE recorded:
 * the signing roles, then one line per required witness, then a notary line
 * where the state requires the instrument itself to be notarized.
 *
 * Only `witnesses_required` and `notarization_required_for_document` are
 * consulted, because those are the only formalities the rules layer can express.
 * Constraints it cannot express — who may witness, statutory certificate wording,
 * per-power initialing — are NOT represented here and must not be assumed
 * satisfied because a block printed. `recordedExecutionNotice` says so on the
 * trust, POA and healthcare directive. NOTE: the will and pour-over will derive
 * their blocks through `testamentarySignatureLines` and carry NO such notice —
 * see the decision recorded in docs/ANCILLARY_RULES_GAPS.md.
 */
export function ancillarySignatureLines(opts: {
  ruleset: StateRuleset;
  roleLines: string[];
}): string[] {
  const { ruleset, roleLines } = opts;
  const lines = [...roleLines, "Date"];

  if (ruleset.executionAlternatives) {
    return [...lines, ...alternativeExecutionLines(ruleset.executionAlternatives)];
  }

  for (let i = 1; i <= ruleset.witnessesRequired; i++) {
    lines.push(`Witness ${i} — signature / printed name / address`);
  }
  if (ruleset.notarizationRequired) lines.push("Notary Public");
  return lines;
}

/** Plain wording for one option, derived rather than stored. */
export function describeExecutionOption(option: ExecutionOption): string {
  const parts: string[] = [];
  if (option.witnesses > 0) {
    parts.push(
      option.witnesses === 1 ? "one witness" : `${option.witnesses} witnesses`,
    );
  }
  if (option.notary) parts.push("notarization");
  return parts.join(" and ");
}

/**
 * Render a genuine either/or.
 *
 * A disjunction cannot be flattened into one block: printing both rituals as if
 * both were required overstates the law, and printing one silently picks a
 * branch on the signer's behalf — and the branches are not equivalent in
 * consequence. California accepts a POA witnessed by two people OR acknowledged
 * before a notary, but only the notarized route carries the § 4406 duty to
 * accept. So both are printed, labelled, and the choice is left to the signer
 * and their attorney.
 */
export function alternativeExecutionLines(
  options: ExecutionOption[],
): string[] {
  const lines: string[] = [
    `${ATTORNEY_REVIEW_REQUIRED} This state accepts EITHER of the following. ` +
      `Complete ONE of them in full — not both, and not a mixture. Which one is ` +
      `appropriate can affect how readily a bank or other third party accepts ` +
      `this document, so confirm the choice with your attorney.`,
  ];

  options.forEach((option, index) => {
    lines.push(
      `— Option ${index + 1}: ${describeExecutionOption(option)} —`,
    );
    for (let i = 1; i <= option.witnesses; i++) {
      lines.push(`Witness ${i} — signature / printed name / address`);
    }
    if (option.notary) lines.push("Notary Public");
  });

  return lines;
}

/**
 * Printed when an instrument's execution rules ARE recorded for the state. A
 * correct signature block is not a complete document, and the difference matters
 * most on exactly these instruments: Fla. Stat. § 709.2202 requires the principal
 * to initial each enumerated "superpower", and A.R.S. § 14-5501(D)(4) prescribes
 * mandatory notarial certificate wording. Neither is generated. Without this
 * notice, a state-derived witness-and-notary block would imply otherwise.
 */
export function recordedExecutionNotice(
  kind: DocumentKind,
  stateName: string,
): string {
  return (
    `${ATTORNEY_REVIEW_REQUIRED} The signature block below reflects ${stateName}'s ` +
    `recorded witness and notarization requirements for a ${INSTRUMENT_LABEL[kind]}. ` +
    `It does NOT mean the document is complete: who may serve as a witness, any ` +
    `statutory certificate wording, and any requirement to initial individual powers ` +
    `are not generated here. A licensed attorney in ${stateName} must confirm both ` +
    `the content and the execution before this is signed or relied on.`
  );
}

/** Human-readable instrument names, for notices addressed to the customer. */
export const INSTRUMENT_LABEL: Record<DocumentKind, string> = {
  will: "will",
  pourover: "pour-over will",
  trust: "revocable living trust",
  poa: "durable financial power of attorney",
  healthcare: "advance healthcare directive",
  hipaa: "HIPAA authorization",
  affidavit: "affidavit",
};

/**
 * The notice printed on any document whose execution formalities are not yet in
 * `state_rules`. States what is missing and what the reader must not assume.
 */
export function unresearchedExecutionNotice(
  kind: DocumentKind,
  stateName: string,
): string {
  return (
    `${ATTORNEY_REVIEW_REQUIRED} Execution requirements for a ${INSTRUMENT_LABEL[kind]} ` +
    `in ${stateName} — how many witnesses are needed, who may act as one, and whether ` +
    `notarization is required — are NOT yet recorded in this platform's state rules. ` +
    `The signature block below is therefore not state-specific: it names only the ` +
    `signing parties. Do not sign or rely on this document until a licensed attorney ` +
    `in ${stateName} confirms the formalities that apply to it.`
  );
}

/** The line that stands in for witness/notary lines we cannot justify printing. */
export const PENDING_EXECUTION_BLOCK_LINE =
  `${ATTORNEY_REVIEW_REQUIRED} Witness and notary lines pending attorney review`;

/**
 * Fail-closed block: the roles that are true regardless of jurisdiction, then an
 * explicit marker where the state-specific lines belong.
 */
export function unresearchedSignatureLines(roleLines: string[]): string[] {
  return [...roleLines, "Date", PENDING_EXECUTION_BLOCK_LINE];
}

/**
 * Self-proving affidavit section for a testamentary instrument, resolved per
 * state from the clause library. Returns the section to append and, where the
 * clause is researched, the statute-specific execution lines it supplies.
 *
 * Shared by the will and the pour-over will so the two cannot drift: before
 * this, the pour-over will emitted no affidavit at all, silently downgrading a
 * trust customer's will relative to an identical will-package customer's in the
 * same state.
 */
export function selfProvingAffidavitSection(opts: {
  ruleset: StateRuleset;
  signerName: string;
  stateName: string;
}): { section: DocSection; clauseSignatureLines: string[] | null } | null {
  const { ruleset, signerName, stateName } = opts;
  const sp = ruleset.selfProvingAffidavit;

  if (sp.available === "uncertain") {
    return {
      section: {
        heading: "Self-Proving Affidavit",
        paragraphs: [
          `${ATTORNEY_REVIEW_REQUIRED} Self-proving affidavit availability in ${stateName} requires attorney confirmation and is omitted from this draft.`,
        ],
      },
      clauseSignatureLines: null,
    };
  }
  if (sp.available !== true) return null;

  const clause = selfProvingAffidavitFor(ruleset.state, {
    testatorName: signerName,
    stateName,
    witnessCount: ruleset.witnessesRequired,
    requiresNotary: sp.requiresNotary,
  });

  const paragraphs = [...clause.paragraphs];
  if (needsAttorneyReview(clause.provenance)) {
    paragraphs.push(
      clause.provenance.status === "researched"
        ? `${ATTORNEY_REVIEW_REQUIRED} This affidavit is drafted to track ${clause.provenance.citation} and has not yet been approved by an attorney.`
        : `${ATTORNEY_REVIEW_REQUIRED} (${
            sp.requiresNotary
              ? `Notarization required in ${stateName}.`
              : `${stateName} may permit an unsworn declaration in lieu of notarization.`
          })`,
    );
  }

  return {
    section: { heading: "Self-Proving Affidavit", paragraphs },
    // A researched clause supplies its own statute-specific execution block
    // (notary wording, commission line, seal); prefer it over the generic one.
    clauseSignatureLines:
      clause.provenance.status === "researched" ? clause.signatureLines : null,
  };
}

/**
 * Execution block for a testamentary instrument, derived entirely from the
 * ruleset: signer, date, one line per required witness, then either the
 * statute-specific block from a researched affidavit clause or a generic notary
 * line where the state requires notarization.
 *
 * A notary line is printed when EITHER the self-proving affidavit requires a
 * notary OR the state requires the instrument itself to be notarized. The second
 * condition was previously never consulted — `notarizationRequired` is true for
 * Louisiana and was read only by the execution-instructions page, never by the
 * document.
 */
export function testamentarySignatureLines(opts: {
  ruleset: StateRuleset;
  signerRole: string;
  clauseSignatureLines?: string[] | null;
}): string[] {
  const { ruleset, signerRole, clauseSignatureLines } = opts;
  const lines: string[] = [signerRole, "Date"];

  for (let i = 1; i <= ruleset.witnessesRequired; i++) {
    lines.push(`Witness ${i} — signature / printed name / address`);
  }

  if (clauseSignatureLines && clauseSignatureLines.length > 0) {
    const seen = new Set(lines);
    for (const line of clauseSignatureLines) {
      if (!seen.has(line)) lines.push(line);
    }
    return lines;
  }

  const notaryRequired =
    (ruleset.selfProvingAffidavit.available === true &&
      ruleset.selfProvingAffidavit.requiresNotary) ||
    ruleset.notarizationRequired;

  if (notaryRequired) lines.push("Notary Public");
  return lines;
}
