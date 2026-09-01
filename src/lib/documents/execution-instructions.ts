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
  /**
   * Whether the state permits electronic wills by statute. This is NOT a claim
   * that the platform produces one: every seeded `electronic_will_permitted`
   * row carries `mvp_position: "wet_signature"`, so the generated document is
   * paper in all 51 jurisdictions. Surfaced so the instructions can say that
   * plainly in the 15 jurisdictions where a customer might reasonably expect to
   * be able to sign online.
   */
  electronicWillPermitted: boolean;
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
  // `electronicWillPermitted` was parsed into the ruleset and then read by
  // nothing at all — the one seeded key with no consumer anywhere in the
  // product. It is consumed here, and only to close a gap it would otherwise
  // leave open: in these 15 jurisdictions the customer may well have read that
  // their state allows an electronic will, and every instruction above tells
  // them to print and sign in ink without ever explaining why. Saying nothing
  // invites them to improvise. This asserts nothing about whether an electronic
  // will would be valid for them — only what THIS document is.
  if (ruleset.electronicWillPermitted) {
    steps.push(
      `${stateName} permits electronic wills by statute, but the document produced here is a paper (wet-signature) will and is not an electronic will — follow the printed steps above and do not attempt to sign it electronically.`,
    );
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
    electronicWillPermitted: ruleset.electronicWillPermitted,
    steps,
    checklist,
    attorneyReviewRequired: true,
  };
}
