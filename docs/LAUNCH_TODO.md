# Pre-Launch To-Do

Current, actionable list of what remains before My Defender Will & Trust can go
live. (For the detailed security/pentest/load checklist see `LAUNCH_CHECKLIST.md`;
this is the higher-level owner view. For everything counsel must sign off, see
`LEGAL_REVIEW_CHECKLIST.docx`.) As of 2026-07-29.

**Already done:** couples document generation (mirror wills / joint trust /
reciprocal directives), graceful checkout when Stripe is unset, GitHub Pro +
branch protection, git-connected Vercel deploys, permanent entitlement grants,
refund and chargeback revocation, vault access after a membership lapse,
per-subsystem env validation.

**Closed on purpose:** the **couples tier is not on sale** — see
`src/lib/features.ts`. Generation works, but both spouses' documents land in one
account and the second spouse gets no login. Reopening it needs the household
model below.

## Owner (accounts & infrastructure) — Dave
- [ ] **Connect Stripe** — account, products/prices, the 7 env vars + webhook
      (`docs/STRIPE_SETUP.md`). Enables all card payments.
- [ ] **Connect Resend email** — verified sending domain + `RESEND_API_KEY`.
      Enables "documents ready" emails.
- [ ] **Connect PDF generation** — Gotenberg URL or LibreOffice — or decide
      DOCX-only and surface that in the UI.
- [ ] **Add a payment method to Vercel** before the Pro trial expires (~2026-07-27).

## Counsel (attorney review)
- [ ] Replace all `[ATTORNEY REVIEW REQUIRED]` text — `src/lib/legal.ts`, the
      Terms and Privacy pages.
- [ ] Finalize clause language in the will/trust/directive generators (incl. the
      new couples documents) + use each state's statutory POA/healthcare/HIPAA
      forms verbatim where they exist.
- [ ] Approve the 7 `document_templates` (flip `approved=false→true` via the admin
      approval workflow) and bump `DISCLAIMER_VERSION` off the placeholder value.
- [ ] Per-state QA sign-off — clear `needs_review` / `qa_approved`; decide which of
      LA / TX / NC / MO / OH to open (Texas alone ≈ 9% of US population).

## Engineering — the one that blocks couples revenue
- [ ] **Household model, so each spouse has their own login.** This is the only
      thing standing between us and reopening the couples tier, and it is worth
      real money: couples pricing is $249 vs $159 on the Will package and $579 vs
      $449 on the Trust package.

      Today `matters` carries a single `user_id`, `documents` hangs off
      `matter_id`, and RLS is `user_id = auth.uid()`. So one login holds both
      spouses' wills, POAs, directives and HIPAA authorisations. If the account
      holder dies — the event the product exists for — the survivor cannot reach
      the will that names them. On separation, one party holds both sets.

      What it takes: a `households` table; party B invited by email; B creates
      their own Supabase auth account; per-document ownership so each spouse owns
      their own set with the joint trust shared; the entitlement grant issued to
      both users; and executed documents immutable so neither party can alter or
      delete the other's copy. Then flip `COUPLES_TIER_OPEN` in
      `src/lib/features.ts` — the checkout tier, the interview question and the
      generation coercion all read that one switch.

## Engineering (do when ready)
- [ ] Update the two tests that assert output contains "ATTORNEY REVIEW REQUIRED"
      (`will.test.ts`, `trust.test.ts`) — they go red when real clause text lands.
- [x] Tighten env validation (`src/lib/env.ts`) — each subsystem now validates its
      own variables at the point of use and names every missing one at once, so the
      pre-launch phase still runs unconfigured. `npm run check:env` reports what is
      still unset without throwing.
- [x] **Tie the couples choice to the purchased tier** — `party` is now coerced to
      `individual` in `generate.ts` while the tier is closed, so a crafted answer
      cannot produce a couples package. Revisit as part of the household model:
      once couples is back on sale, the interview choice must match what was
      bought, not just be allowed.
- [ ] Optional **phone field** at signup (for the CRM/Salesforce plan) if phone
      outreach is wanted (`docs/CRM_SALESFORCE_PLAN.md`).
- [ ] Security passes — download/vault access (IDOR), forged webhook rejection,
      access-code brute-force, RLS integration tests vs live DB, admin MFA, WCAG
      accessibility audit.
- [ ] Apply migration `20260712000014_entitlement_grants.sql` to the hosted
      project. It backfills grants from every active `subscriptions` row and every
      comp redemption, so no existing test user loses access. **Verify the backfill
      counts before and after** — access is resolved from grants once it lands.
- [ ] Set `DISCLAIMER_VERSION` in the environment to the string counsel approves.
      Generation now refuses to run in production without it, and every consent
      record written during the test phase carries `unapproved-placeholder` — decide
      with counsel whether to purge those rows.
- [ ] Decide the refund policy wording now that a full refund revokes the
      entitlement automatically (`charge.refunded`, `charge.dispute.created`). A
      partial refund deliberately leaves access intact.

## Final step — last
- [ ] **Turn search indexing back on** — `src/app/robots.ts` +
      `src/app/layout.tsx` metadata. The very last flip when going live.

---

**Porting note:** the counsel and engineering items apply to **Family First**
(`~/family-first-will-trust`) too — identical codebase outside branding. Make them
here and port; re-check the `DFND-` access-code prefix stays My-Defender-only.
