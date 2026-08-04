/**
 * Product flags that gate a whole tier or feature. Kept in one neutral module so
 * that checkout, the interview and document generation all read the same switch
 * rather than each carrying their own copy of the rule.
 */

/**
 * The couples tier is OPEN — the household model shipped (migrations 15–16;
 * docs/HOUSEHOLD_WORK_ORDER.md). Each spouse now holds their OWN login and owns
 * their OWN document set; the joint trust is shared across the household. So the
 * survivor can always reach the will that names them, which is exactly what the
 * closed tier could not guarantee.
 *
 * This one switch is read in three places and turning it on activates all three:
 *   1. the couples price is offered at checkout (gate page + assertPartyAvailable)
 *   2. the interview offers "my spouse or partner and me" (which creates the
 *      household and links this matter to it — see interview/actions.ts)
 *   3. generation produces the couples package and routes each spouse's set to
 *      their own account (documents/generate.ts)
 *
 * Note: Stripe is still unwired, so testers enter via comp codes exactly as
 * individuals do; enforcing that the purchased tier matches the interview choice
 * stays deferred until Stripe (docs/LAUNCH_TODO.md). All couples clause text
 * remains [ATTORNEY REVIEW REQUIRED] placeholder pending counsel.
 */
export const COUPLES_TIER_OPEN = true;
