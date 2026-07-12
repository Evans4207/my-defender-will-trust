/**
 * State bar lawyer-referral directories (build plan §3.3 / Phase 4). Used by the
 * "find an attorney in your state" page.
 *
 * NOTE: Curated for the pilot states; all other states fall back to the ABA
 * national directory. Verify and complete these URLs during the 50-state
 * rollout (Phase 6) — bar referral programs and URLs change.
 */
export const ABA_REFERRAL =
  "https://www.americanbar.org/groups/legal_services/flh-home/";

export const STATE_BAR_REFERRALS: Record<string, string> = {
  CA: "https://www.calbar.ca.gov/Public/Need-Legal-Help/Lawyer-Referral-Service",
  FL: "https://www.floridabar.org/public/lrs/",
  NV: "https://www.nvbar.org/find-a-lawyer/",
  AZ: "https://www.azbar.org/for-the-public/",
  TX: "https://lrs.texasbar.com/",
};

/** Referral URL for a state, falling back to the ABA national directory. */
export function referralFor(state: string): { url: string; national: boolean } {
  const url = STATE_BAR_REFERRALS[state];
  return url ? { url, national: false } : { url: ABA_REFERRAL, national: true };
}
