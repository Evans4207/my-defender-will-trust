# What to Test Right Now (for Donovan)

We're in the **pre-Stripe test phase**. This scopes your testing honestly so you
don't file false bugs on things that aren't wired up yet — and don't sign off on
paths that were never really exercised.

## ✅ Ready to test

- Signup, login, magic link, password reset
- Partner **access-code** redemption (comp codes and discount codes)
- The full **Will and Trust interview** — autosave, leave-and-resume, validation
- **DOCX** document generation and download
- Vault upload/download, trust funding tracker, annual checkup
- The admin portal — partners, codes, state-rules editor, metrics

## ⏳ Not available yet — expected, don't file as bugs

| Area | What you'll see | Why |
|---|---|---|
| **Card checkout / membership** | Buttons are **disabled** with "Card payments are being set up"; the gate page shows a notice | Stripe isn't connected yet — that's the next step |
| **Couples package** | Not offered anywhere | Intentionally disabled until couples documents are built + attorney-reviewed |
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

Found something outside this list that seems broken? That's a real bug — send it to
Dave with the page URL and what you did.
