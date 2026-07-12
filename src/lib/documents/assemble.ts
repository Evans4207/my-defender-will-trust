import type { AssembledDocument, DocumentKind } from "./model";
import type { StateRuleset } from "./state-rules";
import type { Answers } from "./answers";
import { assembleWill } from "./will";
import { assembleTrust, assemblePouroverWill } from "./trust";
import { assemblePoa, assembleHealthcare, assembleHipaa } from "./ancillary";

/** Dispatch: build the assembled document for a given kind. */
export function assembleDocument(
  kind: DocumentKind,
  opts: { answers: Answers; ruleset: StateRuleset },
): AssembledDocument {
  switch (kind) {
    case "will":
      return assembleWill(opts);
    case "trust":
      return assembleTrust(opts);
    case "pourover":
      return assemblePouroverWill(opts);
    case "poa":
      return assemblePoa(opts);
    case "healthcare":
      return assembleHealthcare(opts);
    case "hipaa":
      return assembleHipaa(opts);
    case "affidavit":
      throw new Error("affidavit is embedded in the will, not generated standalone");
  }
}
