# Work Log

Running record of notable work, with pointers to deliverables that live outside
the repo (shareable web pages). Newest first.

## 2026-07-29/30 — Entitlement model, access fixes, live-deploy repairs

Triggered by a review of the Family First codebase: the two are identical outside
branding, so every defect found there existed here too — and this is the repo in
testing, so it was fixed here first, then ported.

**Code changes (committed to `main`, deployed):**
- `8e367a1` — **Access resolves from `entitlement_grants`** (migration
  `20260712000014`), where a one-time purchase carries `expires_at = null` and cannot
  lapse. Previously access hung off `subscriptions.status`, so a permanent purchase
  depended on a mutable column. Three gates split: builder on live entitlement,
  archive on ownership, perks on membership; the dashboard no longer hard-redirects to
  `/gate`. Adds `charge.refunded` and `charge.dispute.created` — **there was no refund
  handler at all**, so a refunded customer kept access forever. A partial refund
  deliberately does not revoke.
- `fb26ea9` — **Couples tier closed** behind `COUPLES_TIER_OPEN`
  (`src/lib/features.ts`), enforced at checkout, on the gate page, in the interview,
  and coerced server-side in `generate.ts`. Reason: both spouses' documents land in
  one login and the second spouse gets no route to their own will.
- `952d26a` — **Vault survives a lapsed membership** (uploads gated, retrieval never),
  plus `/account/export` returning everything as one ZIP with no entitlement check.
  Dependency-free store-only ZIP writer in `src/lib/vault/zip.ts`.
- `af72176` — **Per-subsystem env validation** naming every missing variable at once,
  `npm run check:env`, and `DISCLAIMER_VERSION` read from the environment.
- `41db564` — **Hotfix.** The disclaimer guard keyed on `NODE_ENV === "production"`,
  but a hosted test deployment is production too, so it blocked document generation
  for the testers. Now fails closed by default and honours an explicit
  `ALLOW_PLACEHOLDER_DISCLAIMER=true`.
- `d16ecf1` — Home page **stopped advertising a couples price** nobody could buy;
  test plan and scope refreshed and reconciled.
- `c758543`, `b1bd467` — Operational scripts; test plan reflects the test memberships.

**Docs added:** `START_HERE.md`, `docs/LEGAL_REVIEW_CHECKLIST.docx` (8 sections,
~60 items), `docs/ACCESS_AND_SUPPORT_WORK_ORDER.md`, `WORK_NOTES_2026-07-29.md`.

**Infrastructure done this session:**
- Migration `20260712000014` **applied to the hosted Supabase project** — 6 grants
  backfilled (1 trust, 5 will), all permanent, matching the expected count.
- `ALLOW_PLACEHOLDER_DISCLAIMER=true` added in Vercel (Production + Preview) and the
  production deployment redeployed to pick it up. **Remove at launch.**
- Test memberships granted to all six test accounts through July 2027
  (`source = manual`). **Revoke before launch.**
- Live site verified after deploy: couples pricing gone, home page renders.

**Verification standard:** typecheck clean, lint clean, 140/140 unit tests.
`npx vitest run` does **not** work on this machine — the rolldown native binding in
`node_modules` is macOS-arm64 and vitest fails at startup elsewhere. Tests were run
by transpiling with `tsc` and driving the suites through a small assertion shim.

**Gotcha found:** `git` cannot complete operations over the connected-folder mount —
lock files cannot be unlinked, leaving stray `.git/*.lock` and `tmp_obj_*`. The
`*.command` wrappers in the repo root exist so a real Terminal can clear them.

## 2026-07-24 — Collaboration setup, couples support, launch prep

**Code changes (committed to `main`, deployed to Vercel):**
- `f57d137` — **Couples support**: mirror wills, joint revocable living trust,
  reciprocal POA/healthcare/HIPAA, per-spouse pour-over wills. New signer/party
  dimension (`src/lib/documents/couples.ts`, `package.ts documentSpecsFor`);
  interview captures `party` + spouse name; storage paths tagged by signer (no DB
  migration); couples pricing + checkout re-enabled. All clause text remains
  `[ATTORNEY REVIEW REQUIRED]`. Tests: `couples.test.ts`.
- `dd6956c` — **Graceful checkout** when Stripe is unconfigured (disabled CTAs +
  notice instead of a 500) and disabled the couples tier for pre-Stripe testing
  (later re-enabled by `f57d137`).
- `1021be2` — Re-trigger deploy with the correct commit author email
  (`Dave@legacycapitalservices.com`; the gmail was blocked by Vercel).

**Docs added this session:** `DONOVAN_TEST_PLAN.md`, `LAUNCH_TODO.md`,
`DONOVAN_TEST_SCOPE.md`, `GITHUB_WORKFLOW.md`, `MARKETING_GUIDE.md`,
`COLLABORATOR_SETUP.md`, `CRM_SALESFORCE_PLAN.md`.

**Infrastructure:** repo now at `github.com/Evans4207/my-defender-will-trust`
(private), git-connected to the Vercel project; **GitHub Pro** enabled; branch
protection on `main` (require PR + 1 approval) + auto-merge; marketer **Donovan**
(GitHub `DLRII`) invited to GitHub + Vercel.

**Shareable web pages (NOT in the repo — links for reference):**
- Donovan getting-started guide — https://claude.ai/code/artifact/5cd12353-3ec2-49f6-b2ba-0a9e28ab58f4
- Test plan (same content as `DONOVAN_TEST_PLAN.md`) — https://claude.ai/code/artifact/d188508b-a9ec-4978-a39c-adde5b593df0

**Key gotcha for future commits:** this repo's commit author email **must** be
`Dave@legacycapitalservices.com` (the only verified email on GitHub acct
`Evans4207`). Any other email → Vercel blocks the deploy.

**Related project:** Family First Will & Trust (`~/family-first-will-trust`) is an
independent rebrand of this codebase (own logo, own repo/accounts). The couples
feature and all counsel/engineering launch items apply there too — port when ready.
