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
- Live-service acceptance for Phases 0–4 (auth / migrations / seed / Stripe /
  interview / Storage + PDF + email / vault + funding) pending hosted Supabase +
  Stripe (+ optional Gotenberg for PDF). See `docs/SUPABASE_SETUP.md`,
  `docs/STRIPE_SETUP.md`.
- Phases 5–7: not started. Next: Phase 5 — Trust Flow + Ancillary Documents.
