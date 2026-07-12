import type { StateRuleset } from "./state-rules";
import { STATE_NAMES } from "@/lib/interview/states";
import { ATTORNEY_REVIEW_REQUIRED } from "@/lib/legal";

export type ExecutionInstructions = {
  state: string;
  stateName: string;
  witnesses: number;
  notarizationRequired: boolean;
  selfProvingAvailable: boolean | "uncertain";
  selfProvingRequiresNotary: boolean;
  steps: string[];
  checklist: string[];
  attorneyReviewRequired: true;
};

/**
 * Build state-specific execution instructions from the normalized ruleset
 * (data-driven — no per-state branching). Powers the instructions page and a
 * printable checklist.
 */
export function buildExecutionInstructions(
  ruleset: StateRuleset,
): ExecutionInstructions {
  const stateName = STATE_NAMES[ruleset.state] ?? ruleset.state;
  const sp = ruleset.selfProvingAffidavit;

  const steps: string[] = [];
  steps.push("Print the complete document without changing any pages.");
  steps.push(
    ruleset.signatureAtEndRequired
      ? "Sign your name at the END of the will, in ink, in front of your witnesses."
      : "Sign your name in ink in front of your witnesses.",
  );
  steps.push(
    `Have ${ruleset.witnessesRequired} competent witness${ruleset.witnessesRequired === 1 ? "" : "es"}${
      ruleset.witnessMinAge ? ` (each at least ${ruleset.witnessMinAge} years old)` : ""
    } watch you sign, then sign themselves in your presence and each other's.`,
  );
  steps.push(
    "Witnesses should be disinterested (not beneficiaries) wherever possible.",
  );
  if (sp.available === true) {
    steps.push(
      sp.requiresNotary
        ? "Complete the self-proving affidavit in front of a notary public (all parties sign before the notary)."
        : "Complete the self-proving declaration (an unsworn declaration under penalty of perjury is accepted in this state).",
    );
  }
  if (ruleset.notarizationRequired) {
    steps.push("This state requires notarization of the will itself — sign before a notary.");
  }
  steps.push("Store the signed original in a safe place and tell your executor where it is.");
  steps.push(
    `${ATTORNEY_REVIEW_REQUIRED} We recommend a licensed attorney in ${stateName} review your documents before signing.`,
  );

  const checklist: string[] = [
    "All pages printed and in order",
    "Signed in ink" + (ruleset.signatureAtEndRequired ? " at the end of the document" : ""),
    `${ruleset.witnessesRequired} witness signature${ruleset.witnessesRequired === 1 ? "" : "s"} obtained`,
    "Witnesses are not beneficiaries",
  ];
  if (sp.available === true) {
    checklist.push(sp.requiresNotary ? "Self-proving affidavit notarized" : "Self-proving declaration completed");
  }
  checklist.push("Original stored safely; executor informed");

  return {
    state: ruleset.state,
    stateName,
    witnesses: ruleset.witnessesRequired,
    notarizationRequired: ruleset.notarizationRequired,
    selfProvingAvailable: sp.available,
    selfProvingRequiresNotary: sp.requiresNotary,
    steps,
    checklist,
    attorneyReviewRequired: true,
  };
}
