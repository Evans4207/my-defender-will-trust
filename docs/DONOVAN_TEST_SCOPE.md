# What to Test Right Now (for Donovan)

We're in the **pre-Stripe test phase**. This scopes your testing honestly so you
don't file false bugs on things that aren't wired up yet — and don't sign off on
paths that were never really exercised.

_Updated 30 July 2026. The couples package is switched off; everything else on the
ready list below, including the vault and checkup, is now testable — your account has
been given a test membership through July 2027._

## ✅ Ready to test

- Signup, login, magic link, password reset
- Partner **access-code** redemption (comp codes and discount codes)
- The full **Will and Trust interview** — autosave, leave-and-resume, validation
- **DOCX** document generation and download
- **Download everything** — `/account/export` returns a ZIP of every document you
  have, with no membership or purchase required. New.
- **Access persistence** — once you own a document you keep it, even with no active
  purchase. New, and worth testing carefully with Dave's help (test plan §13).
- **Vault, annual checkup, trust funding tracker** — your account has a test
  membership through July 2027, so all three are reachable.
- **The FAQ** at `/faq` — 45 answers across nine sections. New. Shown as a pre-launch
  preview because none of the wording is counsel-approved yet.
- The admin portal — partners, codes, state-rules editor, metrics

## ⏳ Not available yet — expected, don't file as bugs

| Area | What you'll see | Why |
|---|---|---|
| **Card checkout / membership** | Buttons are **disabled** with "Card payments are being set up"; the gate page shows a notice | Stripe isn't connected yet — that's the next step |
| **Couples package** | Not offered anywhere — not on the home page, not at the gate, not in the interview | The documents are built and work, but both spouses' documents would sit in one login and the second spouse would have no way to reach their own will. Closed until each spouse can hold their own account. If you find it offered anywhere, that IS a bug |
| **Refunds removing access** | N/A | The logic exists but needs Stripe to exercise |
| **Contact form / support address** | Neither exists | Not built yet — there is currently no way to contact support from inside the app. Known and scoped |
| **FAQ wording** | An amber "pre-launch preview" notice at the top | Every answer is awaiting counsel review and will change. Report contradictions with how the product actually behaves, and typos — not style |
| **Payment → access unlock** | N/A | Needs Stripe |
| **Document-ready email** | The app may say it sent, but **no email is actually delivered** | Email service (Resend) isn't connected yet |
| **PDF output** | You'll get a **DOCX only**, no PDF | PDF service isn't connected yet |

## Important notes

- **Documents are DRAFTS.** Every generated page is footer-stamped
  `DRAFT — ATTORNEY REVIEW REQUIRED — not legal advice`, and the Terms/Privacy
  pages are placeholders. All legal wording is still pending attorney review — so
  review layout, flow, and content structure, not final legal language.
- **Use an access code to reach the full experience** (interview → documents),
  since card checkout is off. Ask Dave for a test code if you need one.
- The site is intentionally **hidden from Google** during this phase — that's
  correct, not a bug.

## Two things to raise immediately rather than log

These mean a server setting is wrong, not that a feature is unfinished:

1. You're sent to the plan page even though you redeemed a code and previously had
   access.
2. Generating documents shows an error mentioning `DISCLAIMER_VERSION`.

Found something else outside this list that seems broken? That's a real bug — send it
to Dave with the page URL and what you did.
