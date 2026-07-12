/**
 * Partner access-code format (build plan §6).
 * Human-typeable: DFND-XXXX-XXXX using an unambiguous character set
 * (no 0/O, 1/I/L, etc.). Redemption itself is atomic in Postgres
 * (public.redeem_access_code) — this module only handles formatting/validation.
 */

/** Unambiguous uppercase alphanumerics (Crockford-style, minus confusables). */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const CODE_REGEX = new RegExp(
  `^DFND-[${CODE_ALPHABET}]{4}-[${CODE_ALPHABET}]{4}$`,
);

/** Normalize user input: uppercase, strip spaces, collapse to canonical dashes. */
export function normalizeAccessCode(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.startsWith("DFND") && cleaned.length === 12) {
    return `DFND-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`;
  }
  return input.trim().toUpperCase();
}

/** True when the (already-normalized) code matches the DFND-XXXX-XXXX format. */
export function isValidAccessCodeFormat(code: string): boolean {
  return CODE_REGEX.test(code);
}
