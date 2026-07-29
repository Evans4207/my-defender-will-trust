/**
 * Product flags that gate a whole tier or feature. Kept in one neutral module so
 * that checkout, the interview and document generation all read the same switch
 * rather than each carrying their own copy of the rule.
 */

/**
 * The couples tier is CLOSED.
 *
 * Document generation for couples works — mirror wills, a joint trust and
 * reciprocal directives are all produced — but every document lands in ONE
 * account.
 *
 * `matters` has a single `user_id`, `documents` hangs off `matter_id`, and RLS is
 * `user_id = auth.uid()`. So the second spouse gets no login and no route to
 * their own will, POA, healthcare directive or HIPAA authorisation. If the
 * account holder dies — the event this product exists for — the survivor cannot
 * reach the will that names them. On separation, one party holds both sets.
 *
 * Closing the tier means three things, and all three are enforced:
 *   1. no couples price is offered at checkout (gate page + assertPartyAvailable)
 *   2. the interview does not offer "my spouse or partner and me"
 *   3. generation coerces party to "individual" even if an answer says otherwise
 *
 * Reopen only once the household model ships: spouse B invited by email, holding
 * their own auth account, owning their own documents, with the joint trust
 * shared between them. See docs/LAUNCH_TODO.md.
 */
export const COUPLES_TIER_OPEN = false;
