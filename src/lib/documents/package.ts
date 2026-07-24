import type { DocumentKind } from "./model";
import type { Party, SignerRole } from "./couples";

/**
 * Documents included in each package (build plan §3.2):
 *   Will Package  — will + healthcare directive + HIPAA + financial POA
 *   Trust Package — revocable living trust + pour-over will + directives + POA
 *
 * For a COUPLES package each spouse/partner gets their own set (mirror wills /
 * reciprocal directives), and the trust package adds one JOINT trust naming both.
 */

/** Kinds for a single person (kept for callers/tests that don't care about signer). */
export function documentKindsFor(docType: "will" | "trust"): DocumentKind[] {
  return docType === "trust"
    ? ["trust", "pourover", "poa", "healthcare", "hipaa"]
    : ["will", "poa", "healthcare", "hipaa"];
}

/** A document to generate: its kind and which testator it is for. */
export interface DocumentSpec {
  kind: DocumentKind;
  signer: SignerRole;
}

/** The per-person set (excludes the joint trust, which is added once). */
function personSet(docType: "will" | "trust", signer: SignerRole): DocumentSpec[] {
  return docType === "trust"
    ? [
        { kind: "pourover", signer },
        { kind: "poa", signer },
        { kind: "healthcare", signer },
        { kind: "hipaa", signer },
      ]
    : [
        { kind: "will", signer },
        { kind: "poa", signer },
        { kind: "healthcare", signer },
        { kind: "hipaa", signer },
      ];
}

/** Full list of documents (kind + signer) to generate for a matter. */
export function documentSpecsFor(
  docType: "will" | "trust",
  party: Party,
): DocumentSpec[] {
  if (party === "couples") {
    return docType === "trust"
      ? [
          { kind: "trust", signer: "joint" },
          ...personSet("trust", "primary"),
          ...personSet("trust", "spouse"),
        ]
      : [...personSet("will", "primary"), ...personSet("will", "spouse")];
  }
  // Individual: one set. Trust package includes the single-grantor trust.
  return docType === "trust"
    ? [{ kind: "trust", signer: "primary" }, ...personSet("trust", "primary")]
    : personSet("will", "primary");
}
