# Build Plan — phase index & acceptance criteria

Authoritative source: [`BUILD_PLAN.pdf`](./BUILD_PLAN.pdf). This file is a working
index of the phases and their acceptance checklists. Do not skip Phase 0. Complete
each acceptance checklist before advancing.

## Pilot states (Phase 0–3)
TX, CA, FL, NV, AZ. (TX rules are seeded for QA but TX is **excluded** at launch.)

## Excluded states at launch (§5.4)
Louisiana (civil-law / forced heirship), Texas, North Carolina, Missouri, Ohio
(UPL-enforcement history — pending counsel). Availability is a per-state admin
toggle; re-enabling is a config change, not a deploy.

## Confirmed launch pricing (§3.2) — owner-approved
- Will Package: **$159** individual / **$249** couples
- Trust Package: **$449** individual / **$579** couples
- Annual membership: **$49/yr** (ships at launch)
- Discount-code default: 50% off → $79 will / $224 trust individual (per-batch configurable)

## Phases

| Phase | Scope | Acceptance |
|------|-------|------------|
| **0 — Foundations** | Repo, Next+TS+Tailwind+shadcn, Supabase, envs, CI; data-model migrations; seed `state_rules` for 5 pilot states | app boots, auth works, migrations run clean, seed loads |
| **1 — Auth, Payments & Codes** | Signup/login/verify/reset; Stripe products + Checkout + webhooks + billing portal; access-code redemption w/ partner attribution; gate screen | subscribe OR redeem code → dashboard w/ correct entitlement; webhook retries safe; codes can't be over-redeemed |
| **2 — Interview Engine** | Wizard (step registry, autosave, resume, validation, progress); all §3.3 steps for Will flow; plain-English help; review-and-edit | full will interview completable mobile+desktop; refresh loses nothing; funnel events logged per step |
| **3 — Document Generation (Will, 5 pilot states)** | Template engine + approvable versioning; DOCX+PDF; execution-instructions pages; document dashboard; email delivery | generated will per pilot state renders correct conditional clauses + execution instructions; downloads owner-only |
| **4 — Compliance & Membership (launch req)** | Self-help disclaimer system + ack tracking; excluded-state enforcement + waitlist; find-an-attorney page; $49/yr membership w/ 4 perks | excluded states can't start; every doc has logged disclaimer ack; membership renews/cancels cleanly; vault owner-only; funding tracker persists |
| **5 — Trust Flow + Ancillary Docs** | Trust interview branch; RLT + pour-over will; POA/healthcare/HIPAA statutory forms; trust funding page | full trust package generates for pilot states with funding checklist |
| **6 — 50-State Rollout** | Populate `state_rules` + template conditionals in batches of ~10, each verified against current statutes; Louisiana own set or "coming soon" | per-state QA checklist signed off before a state toggles live; states individually toggleable |
| **7 — Admin, Partner Reporting & Polish** | Admin/partner dashboards; metrics funnel; annual reminders; update/regenerate; marketing/SEO; a11y audit; load + pentest checklist | launch checklist complete |

## Membership perks — confirmed for launch (items 1–4, 6; item 5 deferred)
1. Unlimited updates · 2. Secure document vault · 3. Annual estate checkup ·
4. Trust funding tracker · 6. Free reprints/shipping. (5. Digital legacy /
emergency access — deferred.)

## Deferred / future (do not build now)
- Attorney review module (`reviews` schema reserved, no reviewer UI).
- Electronic wills (store per-state rule; MVP = wet signatures everywhere).

## Open decisions for the owner
- Which partners issue codes at launch + each package/discount (default 50%).
- Couples/mirror documents in MVP or Phase 5+.
- Timing of counsel review to re-enable TX/NC/MO/OH (TX ≈ 9% of US population).
- Whether digital legacy/emergency vault access joins membership later.
