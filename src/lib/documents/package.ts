import type { DocumentKind } from "./model";

/**
 * Documents included in each package (build plan §3.2):
 *   Will Package  — will + healthcare directive + HIPAA + financial POA
 *   Trust Package — revocable living trust + pour-over will + directives + POA
 */
export function documentKindsFor(docType: "will" | "trust"): DocumentKind[] {
  return docType === "trust"
    ? ["trust", "pourover", "poa", "healthcare", "hipaa"]
    : ["will", "poa", "healthcare", "hipaa"];
}
