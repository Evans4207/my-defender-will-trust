# Session notes — 2026-07-29

Fixes ported *in intent* from the Family First review. Family First itself carried
no code changes: its nine commits are documentation and branding, and the two
`src/` trees differ only in brand strings. What follows is the first time any of
these defects has actually been fixed in code, and it was done here because this
is the repo that is in testing.

## What changed

**Couples tier closed** (`src/lib/features.ts`). Generation works, but both
spouses' documents land in one account and the second spouse has no login. One
flag, enforced in three places: the checkout tier, the interview question, and a
server-side coercion in `generate.ts` so a crafted answer cannot produce a couples
package. Reopening it is the household-model work in `docs/LAUNCH_TODO.md`.

**Ownership made permanent** (migration `20260712000014_entitlement_grants.sql`).
A one-time purchase used to be recorded as a `subscriptions` row with
`status = 'active'`, and access was resolved from that status — so a permanent
purchase depended on a mutable column. Access now resolves from
`entitlement_grants`, where a purchase carries `expires_at = null` and cannot
lapse. `subscriptions` is untouched and still mirrors Stripe for the billing
portal. The migration backfills every active subscription row and every comp
redemption, so no existing test user loses access.

**Three gates, not one.** Building or editing needs a live entitlement; viewing an
already-generated document needs only ownership; vault and perks need an active
membership. The dashboard no longer hard-redirects to `/gate` — a customer with no
live entitlement but existing matters still reaches their documents.

**Refunds and chargebacks revoke** (`src/lib/stripe/webhook.ts`). There was no
refund handler at all, so a refunded customer kept access forever. A full refund or
a dispute now writes `revoked_at` with a reason. A partial refund deliberately does
not — a goodwill credit should not delete someone's estate plan.

**Vault stops stranding uploads.** Uploading needs an active membership;
downloading and exporting do not. New `/account/export` returns every generated
document and vault file as a single ZIP, with no entitlement or membership check —
it is the customer's own data. The ZIP writer is dependency-free
(`src/lib/vault/zip.ts`).

**Env validation per subsystem** (`src/lib/env.ts`). Each subsystem validates its
own variables at the point of use and names every missing one at once, so the
pre-launch phase still runs unconfigured. `npm run check:env` reports what is unset
without throwing.

**DISCLAIMER_VERSION** now reads from the environment and resolves to
`unapproved-placeholder`. Generation refuses to run in production without an
approved value, because a consent record stamped with a placeholder is not evidence
of anything.

## Verification

`tsc --noEmit` clean. `eslint src` clean. 76 unit tests pass across entitlements,
webhook, zip, env, legal and the couples gate.

Note: `npx vitest run` cannot run in a Linux workspace against this `node_modules`
— the rolldown native binding is built for macOS arm64. Run tests on the Mac.

## Still open

- Apply the migration to the hosted project and check the backfill counts.
- Household model — the only thing blocking couples revenue.
- Everything in `docs/LEGAL_REVIEW_CHECKLIST.docx`.
