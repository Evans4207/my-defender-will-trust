# Work Log

Running record of notable work, with pointers to deliverables that live outside
the repo (shareable web pages). Newest first.

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
