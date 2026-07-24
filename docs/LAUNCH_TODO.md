# Pre-Launch To-Do

Current, actionable list of what remains before My Defender Will & Trust can go
live. (For the detailed security/pentest/load checklist see `LAUNCH_CHECKLIST.md`;
this is the higher-level owner view.) As of 2026-07-24.

**Already done:** couples document support (mirror wills / joint trust /
reciprocal directives), graceful checkout when Stripe is unset, couples pricing
re-enabled, GitHub Pro + branch protection, git-connected Vercel deploys.

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

## Engineering (do when ready)
- [ ] Update the two tests that assert output contains "ATTORNEY REVIEW REQUIRED"
      (`will.test.ts`, `trust.test.ts`) — they go red when real clause text lands.
- [ ] Tighten env validation (`src/lib/env.ts`) so missing Stripe/Resend keys fail
      at boot, not at checkout. Do this AFTER Stripe is connected.
- [ ] **Tie the couples choice to the purchased tier** — right now `party` is a
      free interview choice (fine for testing); lock it to what was bought before
      real sales so an individual buyer can't select couples.
- [ ] Optional **phone field** at signup (for the CRM/Salesforce plan) if phone
      outreach is wanted (`docs/CRM_SALESFORCE_PLAN.md`).
- [ ] Security passes — download/vault access (IDOR), forged webhook rejection,
      access-code brute-force, RLS integration tests vs live DB, admin MFA, WCAG
      accessibility audit.

## Final step — last
- [ ] **Turn search indexing back on** — `src/app/robots.ts` +
      `src/app/layout.tsx` metadata. The very last flip when going live.

---

**Porting note:** the counsel and engineering items apply to **Family First**
(`~/family-first-will-trust`) too — identical codebase outside branding. Make them
here and port; re-check the `DFND-` access-code prefix stays My-Defender-only.
