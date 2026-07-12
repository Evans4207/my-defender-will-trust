/**
 * Launch pricing (build plan §3.2) — OWNER-APPROVED.
 * Amounts in US cents. Two price paths only: full price, and discount-code price.
 * Discount percentage is configurable per code batch (default 50% off list).
 *
 * ⚠️ Do NOT change these amounts without product-owner (Dave) sign-off
 * ("Instructions to the Coding Model" #6).
 */

export type PackageKey = "will" | "trust";
export type PartyType = "individual" | "couples";

export const LAUNCH_PRICES = {
  will: { individual: 15900, couples: 24900 },
  trust: { individual: 44900, couples: 57900 },
  /** Annual membership — ships at launch; full price for all users by default. */
  membership: { annual: 4900 },
} as const;

export const DEFAULT_DISCOUNT_PCT = 50;

/**
 * Apply a percentage discount to a list price, floored to a whole dollar.
 * Matches the owner-stated launch math: 50% off $159 -> $79, $449 -> $224.
 */
export function applyDiscountCents(listCents: number, pct: number): number {
  if (pct <= 0) return listCents;
  if (pct >= 100) return 0;
  const discounted = (listCents * (100 - pct)) / 100;
  return Math.floor(discounted / 100) * 100; // floor to whole dollars
}

/** List price for a package + party type, in cents. */
export function listPriceCents(pkg: PackageKey, party: PartyType): number {
  return LAUNCH_PRICES[pkg][party];
}

/** Format cents as USD (whole-dollar when even). */
export function formatUsd(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
  }).format(dollars);
}
