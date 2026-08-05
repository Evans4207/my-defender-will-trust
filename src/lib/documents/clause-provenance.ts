/**
 * Clause provenance — where a piece of legal text came from, and how far it has
 * been vetted.
 *
 * WHY THIS EXISTS
 * ---------------
 * The clause library started as engineering placeholder text: every clause said
 * [ATTORNEY REVIEW REQUIRED] and nothing more. That is safe but it hands counsel
 * a blank page, and it makes their review slower and more expensive than it needs
 * to be.
 *
 * This module lets a clause carry its research with it: the statute it tracks,
 * the source it was read from, the date it was checked, and — critically — an
 * honest status saying how far that research has been verified.
 *
 * WHAT THIS DOES NOT DO
 * ---------------------
 * Nothing here makes text "approved". `researched` is still unapproved desk
 * research. Only counsel moves a clause to `attorney_approved`, and the
 * per-state go-live gate (state_availability.qa_approved) is unchanged. A
 * researched clause is a better STARTING POINT for review, never a substitute
 * for it.
 */

/** How far a piece of clause text has been vetted. Ordered least → most vetted. */
export type ClauseStatus =
  /** Engineering filler. Not drafted against any source. */
  | "placeholder"
  /**
   * Drafted against a primary source (statute / official form) that we read and
   * cited. Unverified desk research: still requires counsel sign-off.
   */
  | "researched"
  /** Reviewed and approved by counsel. Only counsel may set this. */
  | "attorney_approved";

/**
 * How closely the drafted text must follow the source.
 *
 * This distinction drives drafting strategy and is worth getting right per
 * state: where a statute prescribes a MANDATORY form, the compliant text is the
 * statute's own words and we must not paraphrase. Where a statute offers a
 * sample form on a substantial-compliance standard, text that tracks the
 * statutory elements is acceptable and counsel confirms sufficiency.
 */
export type SourceFidelity =
  /** Statute prescribes exact wording; reproduce verbatim, do not paraphrase. */
  | "mandatory_verbatim"
  /** Statute supplies a sample/"substantially the following form" model. */
  | "statutory_sample"
  /** No prescribed form; drafted from the governing rule + common practice. */
  | "drafted_from_rule";

export type ClauseProvenance = {
  /** Statutory citation this text tracks, e.g. "A.R.S. § 14-2504(A)". */
  citation: string;
  /** Where the text was read. Prefer the state's own published source. */
  sourceUrl?: string;
  /** ISO date the source was last read. Statutes change — this ages. */
  checkedAt: string;
  status: ClauseStatus;
  fidelity: SourceFidelity;
  /**
   * What counsel specifically needs to confirm. Written for the reviewing
   * attorney, and surfaced in the review packet — not shown to customers.
   */
  reviewNote: string;
};

/** True when this text still requires counsel sign-off before it can ship. */
export function needsAttorneyReview(p: ClauseProvenance): boolean {
  return p.status !== "attorney_approved";
}

/**
 * One-line audit trail for the review packet, e.g.
 *   "A.R.S. § 14-2504(A) — researched (statutory sample), checked 2026-08-05"
 */
export function provenanceLine(p: ClauseProvenance): string {
  const fidelity = {
    mandatory_verbatim: "mandatory verbatim form",
    statutory_sample: "statutory sample",
    drafted_from_rule: "drafted from rule",
  }[p.fidelity];
  return `${p.citation} — ${p.status} (${fidelity}), checked ${p.checkedAt}`;
}
