import type { AssembledDocument } from "./model";
import type { StateRuleset } from "./state-rules";
import type { Answers } from "./answers";
import type { Party, SignerRole } from "./couples";
import type { DocumentSpec } from "./package";
import { assembleWill } from "./will";
import { assembleTrust, assemblePouroverWill } from "./trust";
import { assemblePoa, assembleHealthcare, assembleHipaa } from "./ancillary";

/** Dispatch: build the assembled document for a given spec (kind + signer). */
export function assembleDocument(
  spec: DocumentSpec,
  opts: { answers: Answers; ruleset: StateRuleset; party?: Party },
): AssembledDocument {
  const full = {
    answers: opts.answers,
    ruleset: opts.ruleset,
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
