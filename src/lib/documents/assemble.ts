import type { AssembledDocument } from "./model";
import { ruleSourceFor, type Instrument, type StateRuleset } from "./state-rules";
import type { Answers } from "./answers";
import type { Party, SignerRole } from "./couples";
import type { DocumentSpec } from "./package";
import { assembleWill } from "./will";
import { assembleTrust, assemblePouroverWill } from "./trust";
import { assemblePoa, assembleHealthcare, assembleHipaa } from "./ancillary";

/**
 * Dispatch: build the assembled document for a given spec (kind + signer).
 *
 * Each document is handed the ruleset for the instrument that GOVERNS it, which
 * is not always the instrument it is: `ruleSourceFor` sends a pour-over will to
 * will rules, because it is a will.
 *
 * Takes every instrument's ruleset (from `getStateRulesets`) rather than one.
 * Handing the same ruleset to every assembler is how a trust customer's
 * documents were built from rules fetched for the package they bought.
 */
export function assembleDocument(
  spec: DocumentSpec,
  opts: {
    answers: Answers;
    rulesets: Record<Instrument, StateRuleset>;
    party?: Party;
  },
): AssembledDocument {
  const full = {
    answers: opts.answers,
    ruleset: opts.rulesets[ruleSourceFor(spec.kind)],
    party: opts.party,
    signer: spec.signer as SignerRole,
  };
  switch (spec.kind) {
    case "will":
      return assembleWill(full);
    case "trust":
      return assembleTrust(full);
    case "pourover":
      return assemblePouroverWill(full);
    case "poa":
      return assemblePoa(full);
    case "healthcare":
      return assembleHealthcare(full);
    case "hipaa":
      return assembleHipaa(full);
    case "affidavit":
      throw new Error("affidavit is embedded in the will, not generated standalone");
  }
}
