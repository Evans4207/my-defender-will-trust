# Collaborator Setup (for Dave)

One-time steps to let a marketing collaborator work on this site through Claude
Code and review changes via Vercel preview links. After this, day-to-day work
follows `docs/MARKETING_GUIDE.md`.

The project currently has **no GitHub remote** — it's local + deployed to Vercel
via CLI. The steps below put it on GitHub (the shared hub) and switch Vercel to
build a preview link for every branch. Secrets are safe to push: `.env.local` and
`.vercel` are gitignored and untracked (verified).

---

## 1. Put the repo on GitHub

Pick one:

**Option A — let Claude Code do it.** In a session, say: *"Install the GitHub CLI,
authenticate me, then create a private repo and push this project."* Claude will
run `brew install gh`, open `gh auth login` for you to sign in (you enter your own
GitHub credentials — Claude never sees them), then create and push the repo.

**Option B — do it yourself.**
```bash
brew install gh          # if not installed
gh auth login            # sign in to your GitHub account
cd ~/my-defender-will-trust
gh repo create my-defender-will-trust --private --source=. --remote=origin --push
```

Keep the repo **private** — this is pre-launch.

## 2. Invite the collaborator to GitHub

GitHub → the repo → **Settings → Collaborators → Add people** → their GitHub
username or email. "Write" access is enough (lets them push branches; not required
to delete the repo).

## 3. Connect the repo to Vercel (this is what creates preview links)

The Vercel project already exists (`my-defender-will-trust`, team
`team_vTch6t5MxcuIepOoH3mgUxmc`). Connect it to the new GitHub repo so pushes build
automatically:

1. Vercel dashboard → the **my-defender-will-trust** project → **Settings → Git**.
2. **Connect Git Repository** → choose the GitHub repo from step 1.
3. Confirm **Production Branch = `main`**. Every other branch/PR now gets its own
   **Preview Deployment** with a shareable URL — no extra setup.

Vercel already holds the environment variables from your earlier CLI deploys; if a
preview build complains about a missing variable, add it under **Settings →
Environment Variables** and tick the **Preview** environment.

## 4. Invite the collaborator to Vercel

Vercel → team **Settings → Members → Invite** → their email. **Member** role lets
them see deployments and preview links. (Only needed if you want them viewing the
Vercel dashboard directly — the preview *links themselves* work for anyone with
the URL.)

## 5. Hand off

Send the collaborator:
- The GitHub repo link (+ how to open it in Claude Code).
- A pointer to **`docs/MARKETING_GUIDE.md`** — their starting point.

---

## Guardrails already in place

- `CLAUDE.md` instructs Claude Code to protect legal text (`[ATTORNEY REVIEW
  REQUIRED]`, `src/lib/legal.ts`, Terms/Privacy) and prices (`src/lib/pricing.ts`),
  keep edits to the marketing pages, ship via preview branches (not straight to
  `main`), and leave the `noindex`/staging setting alone.
- Merges to `main` (going live) stay gated on your approval.

## Optional: require review before going live

For extra safety, turn on branch protection so nothing reaches `main` without your
review: GitHub → repo **Settings → Branches → Add rule** for `main` →
**Require a pull request before merging**. Then "going live" always means you
approve a PR, and the collaborator can push freely to branches without risk.
