# My Defender Will & Trust — Project Status & Handoff

_Last updated: 2026-07-12. All 8 build-plan phases (0–7) plus launch hardening are
code-complete. This is the single reference for what's done, what's pending, and
what decisions are yours to make._

---

## How to resume this project

1. Open a session in `~/my-defender-will-trust` and say **"continue the build"**.
2. Context is preserved three ways: the **git history** (10 commits), **`CLAUDE.md`**
   (architecture + phase status), and Claude's **saved memory** of this project.
3. When you have the hosted accounts, say **"accounts are live"** and I'll link
   Supabase + Stripe, apply the 12 migrations, load the 51-state seed, seed an
   admin, and drive the whole flow end-to-end.

Key docs in `docs/`: `BUILD_PLAN.pdf` (original brief), `SUPABASE_SETUP.md`,
`STRIPE_SETUP.md`, `STATE_RULES_QA.md`, `LAUNCH_CHECKLIST.md`, and this file.

---

## 1. Features implemented (by phase)

**Phase 0 — Foundations**
- Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui; navy/gold brand, serif
  headings, shield logo. Supabase clients + Next-16 `proxy.ts` session refresh.
- Full data model (12 migrations) with Row-Level Security on every table.
- CI (lint + typecheck + test + build); marketing landing page.

**Phase 1 — Auth, Payments & Codes**
- Email/password signup + verification, login, magic link, password reset.
- Access-code redemption (atomic, race-safe) with partner attribution.
- Stripe Checkout (one-time packages + $49/yr membership), webhooks
  (exactly-once), billing portal. Entitlements resolver + gate screen + dashboard.

**Phase 2 — Interview Engine**
- Resumable, autosaving Will wizard: state, document type, about you, family,
  fiduciaries, assets, distributions (100%-share validation, per stirpes/capita),
  special provisions, ancillary docs, review-and-edit. Per-step funnel events.

**Phase 3 — Document Generation**
- Data-driven clause engine → **DOCX** (+ **PDF** when a converter is configured).
- Per-state conditional clauses (community property, self-proving affidavit,
  signature-at-end, witnesses). Execution-instructions page + printable checklist.
- Private storage, **owner-only signed-URL downloads**, email delivery.

**Phase 4 — Compliance & Membership**
- Affirmative disclaimer **acknowledgment gates generation** and is logged per doc.
- Excluded-state enforcement + waitlist; **find-an-attorney** page.
- Membership perks: **secure vault**, **trust funding tracker**, **annual checkup**.

**Phase 5 — Trust Flow + Ancillary Documents**
- Trust interview branch (trustee/successor). Full packages generate:
  Will = will + POA + healthcare + HIPAA; Trust = trust + pour-over will + POA +
  healthcare + HIPAA. Trust funding tracker + retitling guide.

**Phase 6 — 50-State Rollout**
- Execution formalities for **all 51 jurisdictions**, researched against current
  statutes with citations. Availability: all live **except LA/TX/NC/MO/OH**.
  Per-state QA sign-off flag. `/states` page is DB-driven.

**Phase 7 — Admin, Reporting & Polish**
- Admin portal: metrics + interview funnel; partner & code management + CSV;
  template approval workflow; state-rules editor; user/subscription lookup +
  Stripe refund links. Reminders cron, SEO (sitemap/robots/OG), accessibility.

**Launch hardening**
- Rate limiting on auth + code redemption. User-initiated **account deletion**
  (purges storage + cascades all data).

---

## 2. Legal questions / items still needed (counsel)

> The platform's compliance posture (self-help, not a law firm, recommend an
> attorney) is built in, but the following require your outside counsel before
> launch. Everything legal in the code is marked `[ATTORNEY REVIEW REQUIRED]`.

- [ ] **Finalize all disclaimer wording** (`src/lib/legal.ts`) — signup, interview
      footer, generation gate.
- [ ] **Terms of Service** and **Privacy Policy** (currently placeholders) —
      including the **data-retention policy** language.
- [ ] **Approve/replace every document clause** — will, trust, pour-over will,
      POA, healthcare directive, HIPAA (`src/lib/documents/*`).
- [ ] **Statutory ancillary forms** — use each state's statutory POA / healthcare
      / HIPAA form verbatim where one exists (currently general placeholders).
- [ ] **Per-state QA sign-off** — verify execution formalities, statutory forms,
      and community-property language for each live state, then set
      `qa_approved = true` (admin → State rules). See `docs/STATE_RULES_QA.md`.
- [ ] **Excluded-state clearance** — decide when/if to re-enable TX, NC, MO, OH
      (TX ≈ 9% of the US population) and confirm the **Louisiana** approach.
- [ ] **Self-proving nuances** to confirm: CA (no classic self-proving affidavit),
      OH & DC (no self-proving affidavit for paper wills).
- [ ] **UPL review** of the overall product flow for each launch state.

---

## 3. Pending technical work

- [ ] **Hosted accounts** (blocks live verification): Supabase, Stripe (live mode),
      Resend (email), optional Gotenberg (PDF). Guides in `docs/`.
- [ ] After accounts exist: apply migrations, load seed, seed an admin
      (`profiles.role = 'admin'`), verify auth/RLS/checkout/webhooks/generation live.
- [ ] **PDF conversion** — configure Gotenberg (`GOTENBERG_URL`) or LibreOffice;
      until then DOCX generates and PDF is skipped.
- [ ] **Audit-log coverage review** — confirm every document-access path writes to
      `audit_log` (table + generation/admin/deletion events already logged).
- [ ] **Reminders cron** — set `CRON_SECRET` and confirm Vercel cron fires
      (`vercel.json`).
- [ ] Optional: network **WAF / edge rate limiting** as defense-in-depth (app-level
      limiter already in place).
- [ ] Push the repo to a **remote (GitHub)** for off-machine backup (see below).

_Done post-Phase-7: app-level rate limiting; user-initiated account deletion._

---

## 4. Decisions for you (product owner)

| Decision | Current state | Notes |
|---|---|---|
| **Next.js version** | Built on **16** | Brief said 15; 16 is current. Keep unless you prefer 15. |
| **Document templates** | **Code-based** generators | Not editable `.docx` files. Testable + data-driven; attorneys review clause text in `src/lib/documents/*`. Switchable to docxtemplater if you want editable `.docx`. |
| **Couples / mirror documents** | **Single-person only** | Couples price tier exists; mirror wills/trusts for couples not yet generated. |
| **States live at launch** | All except **LA/TX/NC/MO/OH** | Your call; toggle any state in admin (config, no deploy). |
| **Louisiana strategy** | Excluded ("coming soon") | Civil-law notarial regime; needs its own template set (rules already seeded). |
| **Which partners issue codes** + package/discount | None yet | Create in admin → Partners (default 50% off). |
| **Pricing** | Owner-approved launch numbers | $159/$249 will, $449/$579 trust, $49/yr membership, 50% code discount. Change only with your sign-off. |
| **Digital legacy / emergency vault access** (§12 item 5) | Deferred | Whether it joins membership in a later release. |
| **Post-year-one edit gating** | Not gated | "Unlimited updates" perk — decide whether edits are free or membership-gated after year one. |

---

## 5. Go-live sequence (once you're ready)

1. Create hosted accounts (Supabase, Stripe, Resend) — `docs/SUPABASE_SETUP.md`,
   `docs/STRIPE_SETUP.md`.
2. Tell Claude "accounts are live" → migrations applied, seed loaded, admin seeded.
3. Counsel completes items in §2 above and `docs/LAUNCH_CHECKLIST.md`.
4. Toggle states live in admin as counsel clears them.
5. Work the security / pentest / load sections of `docs/LAUNCH_CHECKLIST.md`.
