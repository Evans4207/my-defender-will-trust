import type { StateRuleset } from "./state-rules";
import { s, type Answers } from "./answers";

/*
 * Couples support. For a couples package we produce a document set for EACH
 * spouse/partner (mirror wills, reciprocal directives) and, for the trust
 * package, one joint revocable living trust naming both. A single document is
 * always "for" one testator, identified by SignerRole; "joint" is a shared
 * document that names both.
 *
 * All resulting clause text remains [ATTORNEY REVIEW REQUIRED] placeholder
 * language, exactly like the single-person generators.
 */

export type SignerRole = "primary" | "spouse" | "joint";
export type Party = "individual" | "couples";

/** Options every assembler now accepts. `signer`/`party` default to the single-person case. */
export interface AssembleOpts {
  answers: Answers;
  ruleset: StateRuleset;
  signer?: SignerRole;
  party?: Party;
}

/** The household's two people. `spouse` is a placeholder for an individual matter. */
export function partyNames(answers: Answers): { primary: string; spouse: string } {
  const about = answers.about ?? {};
  const family = answers.family ?? {};
  return {
    primary: s(about.fullName) || "[Testator]",
    spouse: s(family.spouseName) || "[Spouse]",
  };
}

/** For a single-signer document: the signer ("self") and the other spouse ("other"). */
export function perspective(
  answers: Answers,
  signer: SignerRole,
): { self: string; other: string } {
  const { primary, spouse } = partyNames(answers);
  return signer === "spouse"
    ? { self: spouse, other: primary }
    : { self: primary, other: spouse };
}

/** True when this matter is a couples matter. */
export function isCouple(opts: AssembleOpts): boolean {
  return opts.party === "couples";
}

/** Consistent name for the couple's joint revocable living trust. */
export function jointTrustName(answers: Answers): string {
  const { primary, spouse } = partyNames(answers);
  return `The ${primary} and ${spouse} Joint Revocable Living Trust`;
}
