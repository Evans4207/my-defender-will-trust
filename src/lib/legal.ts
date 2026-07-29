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
 * Version stamp for the self-help disclaimer text, written to
 * `disclaimer_acknowledgments` on every generation. It records WHICH wording the
 * customer agreed to, so it has to change whenever counsel changes the wording.
 *
 * Set `DISCLAIMER_VERSION` in the environment to the value counsel signs off on
 * (a date is the usual convention, e.g. "2026-09-01"). Until then this resolves
 * to an explicit placeholder, and `assertDisclaimerVersionApproved()` refuses to
 * run in production — every consent record produced during the test phase is
 * stamped with the placeholder and should be treated as unapproved.
 */
export const DISCLAIMER_VERSION_PLACEHOLDER = "unapproved-placeholder" as const;

export const DISCLAIMER_VERSION: string =
  process.env.DISCLAIMER_VERSION?.trim() || DISCLAIMER_VERSION_PLACEHOLDER;

/** True when counsel's version string has been supplied. */
export function isDisclaimerVersionApproved(
  version: string = DISCLAIMER_VERSION,
): boolean {
  return (
    version.trim().length > 0 &&
    version !== DISCLAIMER_VERSION_PLACEHOLDER &&
    !version.includes("placeholder")
  );
}

/**
 * Refuse to record a consent stamped with a placeholder version in production.
 *
 * A consent record is the evidence that a customer accepted specific wording. One
 * carrying a placeholder version cannot support that claim, so producing it in
 * production is worse than failing loudly.
 */
export function assertDisclaimerVersionApproved(
  env: string | undefined = process.env.NODE_ENV,
): void {
  if (env === "production" && !isDisclaimerVersionApproved()) {
    throw new Error(
      "DISCLAIMER_VERSION is unset or still a placeholder. Set it to the version " +
        "string counsel has approved before generating documents in production.",
    );
  }
}
