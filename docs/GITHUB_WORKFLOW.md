# GitHub Workflow & Branch Protection

How changes reach the live site, and the repo settings that enforce it.
**Configured 2026-07-24.**

## The workflow

1. A collaborator makes edits (via Claude Code) and opens a **pull request**.
2. On the PR, they click **Enable auto-merge** → **Squash and merge**.
3. Vercel posts a **preview link** on the PR (a private copy of the site with just
   that change) for review.
4. **Dave reviews and clicks Approve.**
5. The moment it's approved, GitHub **merges it automatically**, deletes the branch,
   and Vercel deploys `main` to production.

Nothing reaches the live site without Dave's approval. No manual merge clicking.

## Repo settings that enforce this

**Settings → General → Pull Requests**
- ✅ Allow squash merging (clean, one-commit history per change)
- ✅ Allow auto-merge (merge once requirements are met)
- ✅ Automatically delete head branches (cleanup after merge)

**Settings → Branches → Branch protection rule** (pattern `main`)
- ✅ Require a pull request before merging
- ✅ Require approvals: **1** (Dave)
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ⬜ "Do not allow bypassing" / include administrators — **left off on purpose**, so
  Dave (admin) is never locked out of his own direct pushes; the approval gate
  applies to Write collaborators (e.g. Donovan).

## Plan requirement

These features are **not available on a private repo under a personal GitHub Free
plan** — auto-merge and classic branch protection require **GitHub Pro**, and
ruleset *enforcement* requires a GitHub Team org. The `Evans4207` account was
upgraded to **GitHub Pro** ($48/yr) on 2026-07-24 to enable them. Downgrading to
Free would silently stop enforcing the branch-protection rule.

## Who's who

- **Evans4207** — repo owner (Dave), approves PRs.
- **DLRII** (Donovan@legacycapitalservices.com) — marketing collaborator, Write
  access; opens PRs, enables auto-merge, waits for approval. Onboarding:
  `docs/MARKETING_GUIDE.md`.
