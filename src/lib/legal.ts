/**
 * Central store for legal / compliance copy.
 *
 * ⚠️ [ATTORNEY REVIEW REQUIRED]
 * Every string in this file is PLACEHOLDER language. Final wording comes from
 * outside counsel, NOT from the coding model. Never present any of this text to
 * a user as final legal language. See build plan §8 and "Instructions to the
 * Coding Model" #3.
 */

/** Short self-help disclaimer — signup, interview footer, generation gate. */
export const SELF_HELP_DISCLAIMER =
  "My Defender Will & Trust is not a law firm and does not provide legal advice. " +
  "Use of this platform does not create an attorney-client relationship. This " +
  "platform provides self-help document preparation software. We recommend " +
  "consulting a licensed attorney in your state.";

/** One-line footer variant. */
export const SELF_HELP_DISCLAIMER_SHORT =
  "My Defender Will & Trust is not a law firm and does not provide legal advice. This is self-help document preparation software.";

/** Affirmative acknowledgment label shown before document generation (Phase 4). */
export const GENERATION_ACK_LABEL =
  "I understand this is self-help software, not legal advice, and that no " +
  "attorney-client relationship is formed. I have read the self-help disclaimer.";

/** Attorney-review recommendation shown at the delivery step (Phase 3/4). */
export const ATTORNEY_REVIEW_RECOMMENDATION =
  "We strongly recommend having a licensed attorney in your state review these " +
  "documents before signing.";

/** Marker used throughout the codebase for content awaiting counsel sign-off. */
export const ATTORNEY_REVIEW_REQUIRED = "[ATTORNEY REVIEW REQUIRED]" as const;

/**
 * Version stamp for the self-help disclaimer text. Bump when counsel updates the
 * wording so acknowledgments record which version the user agreed to.
 * ⚠️ [ATTORNEY REVIEW REQUIRED] — placeholder version.
 */
export const DISCLAIMER_VERSION = "2026-07-placeholder" as const;
