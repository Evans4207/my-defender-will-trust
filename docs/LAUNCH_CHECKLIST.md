# Launch checklist

Work top to bottom before go-live. Items marked **[counsel]** require the
outside attorney; **[infra]** require the hosted accounts.

## Legal / compliance (blocking)
- [ ] **[counsel]** Replace all `[ATTORNEY REVIEW REQUIRED]` placeholder text:
      disclaimers (`src/lib/legal.ts`), ToS + Privacy pages, every document
      clause (`src/lib/documents/*`), ancillary statutory forms.
- [ ] **[counsel]** Per-state QA sign-off (`state_availability.qa_approved`) for
      each live state; clear `needs_review` on verified rules. See
      `docs/STATE_RULES_QA.md`.
- [ ] **[counsel]** Confirm the excluded-state list (LA/TX/NC/MO/OH) and Louisiana
      strategy.
- [ ] Verify self-help disclaimers render at signup, interview footer, and the
      generation gate; every generation logs a `disclaimer_acknowledgments` row.

## Infrastructure
- [ ] **[infra]** Supabase project (prod) — migrations applied, seed loaded,
      RLS verified (`docs/SUPABASE_SETUP.md`).
- [ ] **[infra]** Stripe (live mode) — products/prices, webhook endpoint +
      secret, billing portal enabled (`docs/STRIPE_SETUP.md`).
- [ ] **[infra]** Resend (or Postmark) API key + verified sending domain.
- [ ] **[infra]** PDF converter: Gotenberg service (`GOTENBERG_URL`) or
      LibreOffice available; confirm PDF output.
- [ ] **[infra]** `CRON_SECRET` set; Vercel cron (`vercel.json`) firing the
      reminders job.
- [ ] Seed an admin: set a `profiles.role = 'admin'` for the ops user.

## Security (§8)
- [ ] HTTPS + HSTS enforced (Vercel default); secure cookies; CSRF posture
      reviewed (server actions + same-site cookies).
- [ ] RLS spot-check: a user cannot read another user's matters/documents/vault
      (run the guarded integration tests: `RUN_DB_TESTS=1 npm test`).
- [ ] Signed, expiring URLs for all document + vault downloads; no public buckets.
- [ ] MFA enabled for admin accounts (Supabase Auth).
- [x] Rate limiting on auth + code-redemption endpoints — Postgres fixed-window
      limiter (`rate_limit_hit`, migration 0012) applied to signup/login/magic/
      reset + redeem. Verify thresholds; consider a network WAF as defense-in-depth.
- [ ] Audit log capturing document access + admin actions (`audit_log`).
- [x] User-initiated account deletion flow (`/account` → `deleteAccountAction`:
      purges storage + cascades DB rows). **[counsel]** confirm the written
      data-retention policy language on the Privacy page.

## Penetration-test checklist
- [ ] Authz: attempt cross-user access to matters, documents, vault, downloads,
      admin routes (expect 403/redirect).
- [ ] IDOR on `/interview/[matterId]/documents/download` and `/vault/download`.
- [ ] Webhook: forged Stripe signature rejected (400); replay is idempotent.
- [ ] Access-code brute force / over-redemption (atomic RPC + rate limit).
- [ ] Storage: direct object access without a signed URL denied.
- [ ] SSRF/file-upload checks on vault uploads (type/size limits).

## Load testing
- [ ] Interview autosave under concurrency (debounced writes to
      `interview_answers`).
- [ ] Document generation throughput (DOCX + PDF conversion is the bottleneck —
      consider a queue if PDF conversion is slow at volume).
- [ ] Webhook burst handling + idempotency store contention.

## Product / QA
- [ ] Full Will interview completes on mobile + desktop; refresh loses nothing.
- [ ] Full Trust package generates with funding checklist.
- [ ] Subscribe path and access-code path both land on the dashboard with the
      correct entitlement.
- [ ] Accessibility: WCAG 2.1 AA pass (keyboard nav, focus states, contrast,
      labels, skip-link) — run an automated audit (axe/Lighthouse) + manual check.
- [ ] SEO: sitemap + robots reachable; OG tags present; titles per page.
