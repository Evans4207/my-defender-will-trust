# START HERE — My Defender Will & Trust

_Last updated 30 July 2026. Written so this can be picked up cold, without
re-reading a long conversation. Read this, then `docs/LAUNCH_TODO.md`._

---

## Where things stand

| | |
|---|---|
| Code | 8 phases complete; **live on Vercel and in active testing** |
| Git | `github.com/Evans4207/my-defender-will-trust` (private), `main` at `b1bd467` |
| Test site | `my-defender-will-trust.vercel.app` — noindexed on purpose |
| Database | Hosted Supabase, migrations through `20260712000014` **applied** |
| Payments | **Stripe not connected.** All card CTAs deliberately disabled |
| Testing | Marketing tester (Donovan, `donresh@gmail.com`) — see `docs/DONOVAN_TEST_PLAN.md` |
| Sister project | Family First (`~/family-first-will-trust`) — same codebase, own everything |

Six test accounts exist, all unlocked by comp access codes, all now holding a test
membership through July 2027.

---

## The one next action

Nothing is blocking Donovan. The next substantive build is
**`docs/ACCESS_AND_SUPPORT_WORK_ORDER.md`** — the support channel, the FAQ, sharing,
and a legacy contact. Start with P1 (support form + FAQ shell), because everything
else depends on it and the FAQ answers are the forcing function on the rest.

The next substantive *non-code* action is getting `docs/LEGAL_REVIEW_CHECKLIST.docx`
in front of counsel. That is the binding constraint on the calendar, not engineering.

---

## What happened on 29–30 July 2026

A review of the Family First codebase found a set of defects. Because the two
codebases are identical outside branding, every one of them existed here too — and
this is the repo in testing, so they were fixed here first and then ported.

| Commit | What |
|---|---|
| `8e367a1` | Access resolves from permanent `entitlement_grants`, not `subscriptions.status`. Three gates split: builder on entitlement, archive on ownership, perks on membership. Refund and chargeback revocation added — there was none. |
| `fb26ea9` | Couples tier **closed** behind one flag |
| `952d26a` | Vault survives a lapsed membership; `/account/export` added |
| `af72176` | Per-subsystem env validation; `DISCLAIMER_VERSION` from the environment |
| `c2f43b5` | Legal review checklist, access/support work order |
| `41db564` | Hotfix: the disclaimer guard was blocking the test deployment |
| `d16ecf1` | Home page stopped advertising a couples price nobody could buy; test plan refresh |
| `c758543` | Operational scripts |
| `b1bd467` | Test plan reflects the memberships now in place |

Full narrative in `WORK_NOTES_2026-07-29.md`.

Verification standard used: typecheck clean, lint clean, **140 of 140 unit tests
passing**. Note that `npx vitest run` will NOT run on this machine — the rolldown
native binding in `node_modules` is built for macOS arm64 and vitest fails at
startup elsewhere. `npm test` works locally; a Linux environment needs a different
approach.

---

## Operational scripts — what each one is for

All read `SUPABASE_DB_URL` from `.env.local`. None of them print secrets.

| Script | Does | Safe to re-run |
|---|---|---|
| `scripts/apply-migration-14.mjs` | Applies **only** the `entitlement_grants` migration to the hosted DB, in a transaction, reporting backfill counts | Yes — no-ops if the table exists |
| `scripts/grant-test-membership.mjs` | Gives the test cohort a membership grant so the vault, checkup and funding tracker work pre-Stripe. `--revoke` withdraws | Yes — skips existing members |
| `scripts/toggle-test-access.mjs` | Revokes/restores one account's package grants, for test plan §13. Only un-revokes what it revoked | Yes |
| `scripts/check-env.mjs` (`npm run check:env`) | Reports which environment variables are unset, by subsystem | Yes |
| `scripts/db-apply.mjs` | **DANGER — resets the public schema.** Do not run against the hosted project; it destroys test data | No |

The `*.command` files in the repo root are gitignored double-click wrappers. The
`commit-*.command` ones are spent and have been moved to `_to_delete/`.

---

## Things easy to forget

- **`ALLOW_PLACEHOLDER_DISCLAIMER=true` is set in Vercel** (Production + Preview).
  It exists only because a hosted test deployment runs as `NODE_ENV=production`,
  which would otherwise block document generation while `DISCLAIMER_VERSION` is a
  placeholder. **Remove it the day counsel supplies a real version.** Every consent
  record written under it is stamped `unapproved-placeholder` and should be treated
  as unapproved — decide with counsel whether to purge those rows.
- **Six test memberships are live until July 2027**, created as `source = manual`
  grants. Revoke before launch: `node scripts/grant-test-membership.mjs --revoke`.
- **The couples tier is closed** via `COUPLES_TIER_OPEN` in `src/lib/features.ts`.
  One flag, enforced in four places: checkout, the gate page, the interview question,
  and a server-side coercion in `generate.ts`. Reopening it needs each spouse to have
  their own login — see the work order. Trust & Will sells couples on a *shared*
  login and mitigates with sharing plus a legacy contact, which is the cheaper path
  if you want the revenue sooner.
- **Commit author email must be `Dave@legacycapitalservices.com`** — the only
  verified address on the GitHub account. Anything else and Vercel blocks the deploy.
- **`main` has branch protection requiring pull requests.** Recent pushes went
  through as "Bypassed rule violations" because you are an admin. Fine alone, but it
  will block a collaborator.
- **Deployment `dd6956c` (24 July) shows as Blocked** in Vercel. Everything since is
  Ready, so nothing is broken, but worth a glance.
- **`git` operations fail when run over the connected-folder mount** — lock files
  cannot be unlinked. That is why the `.command` wrappers exist: a real Terminal can
  clear the locks. Symptoms are stray `.git/*.lock` and `tmp_obj_*` files.
- **The vault gates uploads, not retrieval.** Downloading and `/account/export` must
  never require a membership. That is deliberate; do not "fix" it.
- **Four test files assert the `[ATTORNEY REVIEW REQUIRED]` marker** and will go red
  the moment counsel's text lands. Rewrite them to assert clause structure; do not
  delete them.
- **Flip search indexing last** — `src/app/robots.ts` and `src/app/layout.tsx`.

---

## Decisions still open

| # | Decision | Why it matters |
|---|---|---|
| 1 | **Reopening couples** | Closed today. The cheap path is sharing + legacy contact + a disclosure at checkout, which is what the market leader does. The right path is per-spouse accounts. Revenue difference is $249 vs $159 on Will, $579 vs $449 on Trust. |
| 2 | **Refund policy wording** | A full refund now revokes the entitlement automatically; a partial refund deliberately does not. The published policy has never been written. |
| 3 | **Test-phase consent records** | Every one carries `unapproved-placeholder`. Purge or keep? Counsel's call. |
| 4 | **Excluded states** | LA, TX, NC, MO, OH are off. Texas alone is ~9% of the US population. |
| 5 | **Legacy contact and release on death** | Nothing exists today. A surviving family member has no route to a document. Designed in the work order, not built. |
| 6 | **Chat/support channel** | There is currently no way to contact support from inside the app. A live chat on a self-help legal product is the highest-UPL-risk surface available; async support with a scripted boundary is the recommendation. |

---

## Where everything lives

| File | What it is |
|---|---|
| `docs/LAUNCH_TODO.md` | The owner's pre-launch list. Start here after this file. |
| `docs/ACCESS_AND_SUPPORT_WORK_ORDER.md` | **The next build.** Support, FAQ, sharing, legacy contact, in dependency order. |
| `docs/LEGAL_REVIEW_CHECKLIST.docx` | Everything counsel must sign off. 8 sections, ~60 items, each pointing at the file where the text or logic lives. |
| `docs/DONOVAN_TEST_PLAN.md` | The tester's walkthrough, 14 sections. |
| `docs/DONOVAN_TEST_SCOPE.md` | What is deliberately unfinished. Send with the plan. |
| `docs/LAUNCH_CHECKLIST.md` | The detailed security/pentest/load list. |
| `docs/STATE_RULES_QA.md` | Per-state research awaiting counsel verification. |
| `docs/BUILD_PLAN.md` | Original brief; still the architectural source of truth. |
| `docs/PROJECT_STATUS.md` | Feature-by-feature status from the build phase. |
| `docs/WORK_LOG.md` | Running record, newest first. |
| `WORK_NOTES_2026-07-29.md` | Full narrative of the 29–30 July fix set. |
| `CLAUDE.md` / `AGENTS.md` | Agent guardrails. |

---

## The rule that matters most

A coding agent must never draft legal language. Plausible-sounding clause text in a
will or a trust is the single most dangerous thing this repo could contain.
Placeholders stay placeholders until an attorney replaces them.

---

## Family First — for when you switch across

`~/family-first-will-trust` and `~/family-first-prenup`. Everything above was ported
there on 30 July (`9030036`), and both repos are pushed and clean.

The important difference: **Family First must not take the shortcut this project
took.** Its Prenup product needs two independent accounts as a matter of function —
two parties, two financial disclosures, two lawyers, possibly adversarial — so the
household model is P1 of that build regardless, and the estate side gets real
per-spouse credentials for free rather than the disclosure-plus-sharing compromise.
Section 1 of `family-first-will-trust/docs/ACCESS_AND_SUPPORT_WORK_ORDER.md` sets it
out. Its couples flag is deliberately still closed.

Family First also has the wider scope: seven products across two domains, a
per-product FAQ, and a legal checklist with a section J covering the access model.
Its migration `20260712000014` is in the repo but **not applied anywhere** — Family
First has no hosted Supabase, Stripe or Resend yet.

Start there with `family-first-will-trust/START_HERE.md`.
