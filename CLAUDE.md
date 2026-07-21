# My Defender Will & Trust

Self-help legal-document platform. Guided, interview-style creation of a
state-compliant Last Will & Testament or Revocable Living Trust (50 states + DC).
Two entry paths: direct Stripe subscribers, and partner access-code users.

**Compliance posture is a core feature, not boilerplate.** This is self-help
document-preparation software (LegalZoom / Trust & Will model). It is NOT a law
firm, provides NO legal advice, and forms NO attorney-client relationship.
Prominent self-help disclaimers appear at signup, in the interview footer, and
before generation. See `src/lib/legal.ts`.

The full brief lives in `docs/BUILD_PLAN.md` — it is the source of truth. Work
**phase by phase**; complete each acceptance checklist before advancing.

## Rules for contributors (human or AI)

1. Work phase by phase; do not scaffold everything at once.
2. All legal template text, disclaimers, ToS/Privacy = clearly marked
   `[ATTORNEY REVIEW REQUIRED]` placeholders. Never present output as final legal
   language.
3. Keep the 50-state legal engine **data-driven** (`state_rules` table) — no
   state-specific `if` statements scattered through templates or code.
4. When populating state rules, research current statutes and record the
   `citation` + `checked_at`. Flag ambiguity with `needs_review = true`.
5. Ask the product owner (Dave) before decisions on: pricing amounts, review-mode
   defaults, which states launch beyond the pilot five, and Louisiana strategy.
6. Write tests for: code redemption (concurrency), Stripe webhooks, template
   rendering per state, and access control on document downloads.

## Working with marketing/content collaborators

A non-developer marketing collaborator edits this site through Claude Code. When a
session is doing **content/marketing edits** (copy, headlines, images, SEO on the
public `(marketing)` pages), follow `docs/MARKETING_GUIDE.md` and these guardrails:

- **Protected — stop and confirm with the owner (Dave) before editing:** any
  `[ATTORNEY REVIEW REQUIRED]` text, `src/lib/legal.ts`, the Terms/Privacy pages,
  and prices in `src/lib/pricing.ts`. Do not soften, remove, or contradict legal
  language, and never write marketing copy implying legal advice or an
  attorney-client relationship.
- **Out of scope for content edits:** the signup/auth flow, interview engine,
  document generation, dashboard, and admin. Flag these as app-logic, not content.
- **Ship via preview, not straight to main.** For a collaborator's change, create a
  branch, push it, and surface the Vercel preview URL for review. Merge to `main`
  only on explicit approval. Never edit `robots`/`noindex` settings — staging is
  intentionally hidden from search during the test phase.
- Explain what you're doing in plain English; assume no coding knowledge.

## Tech stack

- **Next.js 16** (App Router, TypeScript, Turbopack) — ⚠️ NOT Next 15; see below.
- **Tailwind v4** + **shadcn/ui** (built on **Base UI**, not Radix).
- **Supabase** — Postgres + Auth + Storage (hosted).
- **Stripe** (Phase 1), **Resend/Postmark** email (Phase 3).
- **Vitest** for unit tests.

> Note: the brief specified Next.js 15; `create-next-app@latest` installed 16.
> We proceeded on 16 (current release). Flagged for the owner.

## Next.js 16 gotchas (breaking vs. most tutorials)

- **Async request APIs**: `cookies()`, `headers()`, `params`, `searchParams` are
  Promises — always `await`. (See `src/lib/supabase/server.ts`.)
- **`proxy.ts` replaces `middleware.ts`** (Node.js runtime). Session refresh lives
  in `src/proxy.ts`.
- `next lint` removed — use `eslint` directly (`npm run lint`).

## Layout

```
src/
  app/
    (marketing)/        # public site: landing, signup/login stubs, states, terms, privacy
    layout.tsx          # root: fonts (Lora serif + Source Sans), Toaster
    globals.css         # brand theme (navy/gold, oklch) — Tailwind v4 @theme
  components/
    brand/              # Shield motif, Logo lockup
    ui/                 # shadcn/Base UI primitives
    site-header.tsx, site-footer.tsx
  lib/
    supabase/           # client.ts, server.ts, types.ts (regenerate after migrations)
    env.ts              # zod-validated env (client vs server)
    legal.ts            # [ATTORNEY REVIEW REQUIRED] disclaimer copy
    pricing.ts          # owner-approved launch prices (§3.2)
    access-code.ts      # DFND-XXXX-XXXX format (§6)
  proxy.ts              # Supabase session refresh (Next 16 middleware)
supabase/
  migrations/           # schema + RLS (§4)
  seed.sql              # state_rules + availability for pilot states
```

## Commands

- `npm run dev` — dev server (http://localhost:3000)
- `npm run typecheck` / `npm run lint` / `npm test` / `npm run build`
- `npm run db:push` — apply migrations to linked Supabase project
- `npm run db:seed` — load `supabase/seed.sql` (needs `SUPABASE_DB_URL`)
- `npm run db:types` — regenerate `src/lib/supabase/types.ts` from live schema

## Setup

See `docs/SUPABASE_SETUP.md` to create the hosted project and apply the schema.

## Phase status

- **Phase 0 — Foundations: code-complete.** Scaffold, branding, data model +
  RLS, pilot-state seed, CI, landing page.
- **Phase 1 — Auth, Payments & Codes: code-complete.** Supabase Auth
  (email/password + magic link + reset), gate screen, entitlements resolver,
  access-code redemption (atomic RPC), Stripe Checkout + idempotent webhooks +
  billing portal, dashboard. Tests: entitlements, webhook handling, and a
  redemption-concurrency integration test (`RUN_DB_TESTS=1` + live DB).
- **Phase 2 — Interview Engine: code-complete.** Resumable, autosaving Will-flow
  wizard: step registry, progress + est-time, per-step validation, review &
  inline edit, funnel events (`interview_events`), resume pointer
  (`matters.current_step`). Steps: state (LA notice), document, about, family,
  fiduciaries, assets, distributions (100% share validation, per stirpes/capita),
  special provisions, ancillary, review → generate handoff. Trust flow = Phase 5.
- **Phase 3 — Document Generation: code-complete.** Data-driven clause library +
  will assembler (conditionals keyed to `state_rules`, all `[ATTORNEY REVIEW
  REQUIRED]`), DOCX via `docx` lib, PDF via Gotenberg/LibreOffice adapter
  (best-effort), execution-instructions builder + page, private Storage bucket
  (migration 0008) with owner-only signed-URL downloads, documents dashboard,
  Resend email delivery, `template_versions` provenance. 16 rendering/rules unit
  tests + guarded document-access RLS integration test.
  - **Deviation:** templates are code-based generators (programmatic `docx`),
    not binary docxtemplater merge files — chosen for testability + data-driven
    conditionals. All clause text centralized in `src/lib/documents/*` for review.
- **Phase 4 — Compliance Layer & Membership: code-complete.** Affirmative
  disclaimer acknowledgment gates generation + is logged per document
  (`disclaimer_acknowledgments`, migration 0009); excluded-state enforcement
  (client + server) with waitlist capture; find-an-attorney page (state bar
  referrals + ABA fallback). Membership perks: secure vault (owner-only
  up/download via signed URLs), trust funding tracker (persist per matter),
  annual estate checkup + reminder scaffold (`vault_items`, `funding_items`,
  profile checkup fields — migration 0010). Membership renew/cancel via Stripe
  portal (Phase 1).
- **Phase 5 — Trust Flow + Ancillary Documents: code-complete.** Data-driven
  assemblers for RLT (trustee/successor, funding, community property), pour-over
  will, and POA/healthcare/HIPAA (statutory-form-aware placeholders). Trust
  interview branch: doc-type-aware doctype/fiduciaries (trustee+successor)/assets
  steps; dashboard trust start enabled. `generateDocumentsAction` now produces
  the full package per doc_type (will→will+POA+HC+HIPAA; trust→trust+pourover+
  POA+HC+HIPAA). Trust funding tracker + retitling guide (owner-scoped).
  - **Open decision (deferred):** couples/mirror documents — currently single-
    person docs only (party type still captured for pricing).
- **Phase 6 — 50-State Rollout: code-complete.** All 51 jurisdictions seeded in
  `state_rules` (execution formalities researched against current statutes with
  citations; `scripts/gen-state-seed.mjs` generates `supabase/seed.sql`). Every
  row `needs_review=true`; `state_availability.qa_approved` added (migration 0011)
  for per-state counsel sign-off. Availability: all live except **LA/TX/NC/MO/OH**
  (owner decision; config-toggleable). `/states` page is now DB-driven. See
  `docs/STATE_RULES_QA.md` for notable per-state findings.
- **Phase 7 — Admin, Partner Reporting & Polish: code-complete.** Admin portal
  (role-gated): metrics + interview funnel + docs-by-state; partner & code
  management with batch code generation + CSV export + reporting; template
  approval workflow; state-rules editor (availability/QA toggles + per-rule
  edit); user/subscription lookup + Stripe refund links. Reminders cron
  (`/api/cron/reminders`, secret-gated + `vercel.json`); update/regenerate entry
  point; SEO (`sitemap.ts`, `robots.ts`, OG metadata); a11y (skip-link, labels,
  aria); `docs/LAUNCH_CHECKLIST.md` (security/pentest/load).

**All 8 phases (0–7) are code-complete.** Remaining work to launch is the
`docs/LAUNCH_CHECKLIST.md`: counsel review of all `[ATTORNEY REVIEW REQUIRED]`
text + per-state QA, and standing up the hosted accounts (Supabase, Stripe,
Resend, optional Gotenberg). See `docs/SUPABASE_SETUP.md`, `docs/STRIPE_SETUP.md`.
Launch hardening done post-Phase-7: rate limiting on auth + code redemption
(Postgres fixed-window limiter, migration 0012) and user-initiated account
deletion (`/account`, purges storage + cascades DB rows). Migrations through 0012.
