/**
 * Neutral document model produced by an assembler and consumed by renderers
 * (DOCX today; the same model could drive HTML/PDF). Keeps assembly logic
 * independent of the rendering library.
 */
export type DocSection = {
  heading: string;
  /** Ordered paragraphs. Empty strings render as spacing. */
  paragraphs: string[];
};

export type AssembledDocument = {
  kind: DocumentKind;
  title: string;
  state: string;
  /** Signer's display name, used in the title/attestation. */
  signerName: string;
  sections: DocSection[];
  /** Signature/notary lines to render as blanks at the end of the document. */
  signatureLines: string[];
  /** Every generated document carries this flag — never final legal language. */
  attorneyReviewRequired: true;
};

export type DocumentKind =
  | "will"
  | "trust"
  | "pourover"
  | "poa"
  | "healthcare"
  | "hipaa"
  | "affidavit";
