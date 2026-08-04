# Work Order — Household Model (couples, two real accounts)

**Owner decision, 4 August 2026: build the household model HERE first** — this
repo has live testers — **then port to Family First** (whose scope WS3 becomes a
port, reversing the usual porting direction for this one feature). The goal:
Donovan and a partner tester can run the full two-account couples flow end to
end. This document is the drop-in scope for a Claude Code session.

Sources of truth behind it: the suite spec's accounts chapter (§7.5–§7.8 in
`family-first-will-trust/docs/FAMILY_FIRST_SUITE_SPEC.md`) and this repo's
`docs/ACCESS_AND_SUPPORT_WORK_ORDER.md`. Read `docs/LAUNCH_TODO.md` for the
standing constraints.

---

## 0. What exists today — verify, don't rebuild

- Couples **generation** works: `src/lib/documents/couples.ts` produces mirror
  wills, a joint trust and reciprocal directives — all into one account.
- The tier is closed by `COUPLES_TIER_OPEN = false` in `src/lib/features.ts`,
  enforced in four places: `assertPartyAvailable`, the gate page, the interview
  (`step-forms.tsx`), and a server-side coercion in `generate.ts`.
- Entitlements resolve from `entitlement_grants` (migration 14):
  `expires_at NULL` = owned outright; revocation is deliberate.
- `matters` carries a single `user_id`; `documents` hang off `matter_id`; RLS
  is `user_id = auth.uid()`.

## 1. Data model — migration 15, strictly additive

- `households` (id, created_by, created_at).
- `household_members` (household_id, user_id, role `'a' | 'b'`, joined_at) —
  unique (household_id, user_id); enforce max two members per household.
- `household_invites` (id, household_id, email, token_hash, invited_by,
  created_at, expires_at, accepted_at, revoked_at). Store a **hash** of the
  invite token, never the token itself.
- `documents`: add `owner_user_id uuid` (backfill from the matter's user_id)
  and `scope text check (scope in ('private','household')) default 'private'`.
- `matters`: add nullable `household_id`.
- A `security definer` helper `is_household_member(household_id)` — the RLS
  pattern already used elsewhere in this repo. **Never a service-role read.**
- New RLS on documents: owner reads own; household-scoped documents readable
  by both members. **No update/delete path to another member's documents at
  all** — immutability of the other person's set is a schema property, not an
  application courtesy.
- Apply with the `apply-migration-14.mjs` pattern (a copy for 15). **Never
  `db-apply.mjs`** against the hosted project.

## 2. Flows

**Start.** An entitled user choosing “my spouse or partner and me” creates a
household with themselves as member A and shows the invite step.

**Invite.** Email via Resend when configured — but Resend is NOT wired yet, so
the invite screen must always also show a **copy-the-link fallback**. The link
carries the raw token; expiry ~14 days; revocable; re-issuable.

**Accept.** Partner B follows the link, creates **their own account** (normal
signup), and lands as member B. At acceptance, B receives their own
entitlement grant for the same product (`source = 'code'`-style mirror of A's
grant — same product, permanent). Neither grant depends on the other.

**Generate.** A's documents are owned by A; B's mirror set is owned by B; the
joint trust is `scope = 'household'`. The signing-instructions and archive
pages each show the viewer their own set plus household documents.

**Close the loop.** Flip `COUPLES_TIER_OPEN = true` as the final commit —
checkout tier, interview option and generation coercion all read that one
switch. Stripe is still unwired, so testers enter via comp codes exactly as
individuals do; the purchased-tier-must-match-interview check stays deferred
until Stripe (already recorded in LAUNCH_TODO).

## 3. Two deliberate MVP simplifications (do not gold-plate)

1. **Partner A answers the interview for both**, as the couples generator
   already assumes; B reviews the generated documents. Real two-party
   collaboration (propose/approve, per-clause) is the Prenup engine's job and
   arrives by port later.
2. **Joint-trust regeneration**: member A regenerates; B gets read access.
   Either-member regeneration is an open decision — leave a TODO, don't build.

## 4. What Donovan tests when it ships (append to his test plan §17)

- A redeems a comp code, picks couples, invites B via the copy-link fallback;
  B creates their own account with their own email.
- Both log in separately: each sees their own will, POA, directive and HIPAA;
  both see the joint trust; **neither sees the other's private documents**.
- B's access survives A's grant being revoked (`toggle-test-access.mjs`), and
  vice versa.
- No route (UI or API) lets one member edit or delete the other's documents.
- The individual flow is unchanged — full regression pass of test plan §1–§16.
- The state QA reference (`docs/STATE_PAPERWORK_QA.docx`) applies to BOTH
  spouses' document sets — same per-state rules, checked twice.

## 5. Constraints that bind this build

No legal text — `[ATTORNEY REVIEW REQUIRED]` placeholders only. No service-role
reads for user-facing data. Additive migration only, applied singly. The
deferred corrections in `docs/PENDING_CORRECTIONS.md` stay deferred — do not
fix them in passing (one exception: if touching `generate.ts` coercion, keep
the change minimal and separate from any pending-corrections file). Commit
author must be `Dave@legacycapitalservices.com` or Vercel blocks the deploy.
Update `docs/DONOVAN_TEST_PLAN.md` (new §17) and `docs/WORK_LOG.md` in the
same PR. FAQ: the couples answer (`wt-couples` and the My Defender FAQ
equivalent) currently says "not yet" — update its draft wording in the same
change so the site never contradicts itself, leaving `reviewStatus: "draft"`.

## 6. Kickoff prompt for Claude Code

```
Read CLAUDE.md, docs/HOUSEHOLD_WORK_ORDER.md, and docs/LAUNCH_TODO.md in full.
Confirm back to me: the migration-15 table list, the invite flow including the
copy-link fallback (Resend is not configured), the two MVP simplifications,
and the four enforcement points that currently close the couples tier.
Do not write code until I confirm. Then build in this order:
migration 15 → invite/accept flow → ownership + RLS changes → generation
ownership routing → flip COUPLES_TIER_OPEN → test plan §17 + work log.
Stop after each stage and report. Never run db-apply.mjs; migration applies
via a copy of the apply-migration-14.mjs pattern.
```
