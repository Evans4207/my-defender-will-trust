# Marketing & Content Guide

**Who this is for:** the marketing person editing the *My Defender Will & Trust*
website. You do **not** need to know how to code. You'll use **Claude Code** to
make changes, and every change gets its own **preview link** to review before it
goes live.

If a term here is unfamiliar, paste it into Claude Code and ask "what does this
mean?" — that's exactly what it's for.

---

## 1. The workflow in four steps

1. **Open the project in Claude Code** (see [Getting set up](#5-getting-set-up)).
2. **Describe the change in plain English.** Example: *"On the home page, change
   the headline to 'Your Will & Trust, done right.' and make the subtext warmer."*
   Claude finds the right file and makes the edit.
3. **Get a preview link.** Say: *"Push this to a new branch and give me the Vercel
   preview URL."* Claude creates a branch, pushes it, and Vercel builds a private
   preview site at a link like `my-defender-will-trust-git-<branch>.vercel.app`.
   Share that link with Dave for review.
4. **Go live when approved.** Once Dave signs off, say: *"Merge this to main."*
   The change deploys to the real site.

Nothing you do on a branch or preview touches the live site until it's merged.
Previews are safe to experiment with.

---

## 2. Where the content lives (the content map)

All of these are things you can safely ask Claude to edit. You give the plain
description; Claude opens the file.

| What you want to change | Ask Claude about... | File |
|---|---|---|
| **Home page** — hero headline, subtext, buttons, "Two ways to protect...", "How it works" | "the landing page" | `src/app/(marketing)/page.tsx` |
| **States page** — intro copy above the state list | "the states page" | `src/app/(marketing)/states/page.tsx` |
| **Find-an-attorney page** copy | "the find-an-attorney page" | `src/app/(marketing)/find-an-attorney/page.tsx` |
| **Top navigation** — menu links, logo link | "the site header" | `src/components/site-header.tsx` |
| **Footer** — links, copyright line | "the site footer" | `src/components/site-footer.tsx` |
| **Browser tab title & Google search description** (SEO) | "the site metadata / SEO title and description" | `src/app/layout.tsx` |
| **Logo & shield images** | "the brand images" | `public/brand/` |
| **Brand colors** (navy / gold) | "the brand theme colors" | `src/app/globals.css` |

**Tagline & voice:** the brand line is *"Protection Before Panic."* Keep copy
calm, reassuring, and plain-English — this is estate planning; people arrive
anxious. Avoid legal jargon and avoid anything that sounds like a promise of a
specific legal outcome (see the guardrails below for why).

---

## 3. What NOT to change (ask Dave first)

These are edited **only** with Dave's explicit sign-off. If you ask Claude to
touch them, Claude has been instructed to stop and confirm with you first.

- **Legal / disclaimer text** — everything marked `[ATTORNEY REVIEW REQUIRED]`,
  plus the Terms and Privacy pages (`terms/`, `privacy/`) and `src/lib/legal.ts`.
  This wording is under attorney review. Marketing copy must not soften, remove,
  or contradict it, and must never imply the product gives legal advice or
  creates an attorney-client relationship.
- **Prices** — `src/lib/pricing.ts`. These are owner-approved launch prices.
  Changing displayed prices is Dave's decision.
- **Anything past the marketing pages** — the signup flow, the interview, the
  dashboard, document generation, admin. That's application logic, not content.

A good rule of thumb: if it's words/images on the public marketing pages, you're
clear to edit. If it's a price, a legal statement, or a working feature, ask Dave.

---

## 4. Previewing your work

- **Every branch you push gets its own preview URL** — a fully working copy of the
  site with just your changes, on a private link. This is where you and Dave
  review before going live.
- The **live/staging site is currently hidden from Google** on purpose (we're in a
  test phase). Don't change that setting.
- To see a change on your own machine first, ask Claude: *"Run the site locally so
  I can see it."* It opens at `http://localhost:3000`.

---

## 5. Getting set up

Dave will handle the one-time account setup (see `docs/COLLABORATOR_SETUP.md`).
Once he's done that, you'll receive:

1. An invite to the **GitHub** repository (this is where the code lives).
2. An invite to the **Vercel** project (this is what builds your preview links).

Then you open the project in Claude Code and start from step 1 of the workflow
above. If anything is unclear, ask Claude Code directly — describe what you want
in plain words and it will guide you.

---

## 6. Handy phrases for Claude Code

- *"Show me the current home page copy."*
- *"Change [this text] to [that text] on the [page]."*
- *"Make a new branch, push it, and give me the preview link."*
- *"Swap the logo for the new file I put in public/brand/."*
- *"This wording is legal text — is it safe for me to edit, or should I ask Dave?"*
- *"Compare my branch to the live site — what did I change?"*
- *"Dave approved it. Merge to main so it goes live."*
