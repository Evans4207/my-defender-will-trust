# Test Plan — My Defender Will & Trust

A guided, area-by-area walkthrough for the marketing tester (Donovan). Shareable
web version: see the artifact link in `docs/WORK_LOG.md`. Work top to bottom;
each item has an **Expect** result. Items marked _Heads-up_ are intentional
placeholders, not bugs.

## Before you start
- Open the test site: `my-defender-will-trust.vercel.app` (intentionally hidden
  from Google — correct, not a bug).
- Use Chrome on a computer; repeat a short run on a phone at the end.
- **Get a test access code from Dave** — card payments are off, so an access code
  is how you unlock the full flow (signup → interview → documents).
- Use a throwaway email.

## How to report an issue
For each: the **page address**, **what you did**, **what you expected vs. what
happened**, and a **screenshot**. Check the "Not ready yet" list first.

---

## 1. The public website (no login)
- **1.1 Home page loads** — hero, both packages with individual + couples prices,
  how-it-works, footer. _Expect:_ renders cleanly, no broken images.
- **1.2 Header & footer links** work; nothing 404s.
- **1.3 Check your state** — most available; LA/TX/NC/MO/OH show not-yet-open
  (intentional).
- **1.4 Waitlist** — pick a closed state (Texas), submit email → confirmation.
- **1.5 Find-an-attorney** page loads.
- **1.6 Terms & Privacy** load. _Heads-up:_ placeholder text pending counsel.

## 2. Account & sign-in
- **2.1 Sign up** with a new email/password → lands in the app.
- **2.2 Log out and back in.**
- **2.3 Magic-link sign-in** (note if no email arrives — email is limited now).
- **2.4 Forgot password** → reset flow.
- **2.5 Wrong password** → friendly error, not a crash.

## 3. Unlocking access with a code
- **3.1 Redeem the test code** → unlocked to dashboard.
- **3.2 Discount code** (if provided) → discount shows on the plan screen.
- **3.3 Made-up code** → clear "invalid" message.

## 4. Choosing a plan (the gate)
- **4.1 Plan options show** — access-code path + both packages, Individual and
  Couples.
- **4.2 Buy buttons disabled** with "card payments being set up." _Heads-up:_
  intentional — must NOT crash.

## 5. Will interview — just me
- **5.1 Step through every question**: state → doc type → about → family →
  fiduciaries → assets → distributions → special → ancillary → review.
- **5.2 Choose "Just me"** on the About step.
- **5.3 Autosave** — refresh mid-interview; answers retained.
- **5.4 Leave & resume** — dashboard then back; resumes in place.
- **5.5 Validation** — blank required field / beneficiary shares ≠ 100% → clear
  error, can't continue.

## 6. Couples flow (NEW — test carefully)
- **6.1** On About, pick **"My spouse or partner and me."**
- **6.2** On Family, a spouse full-legal-name field appears — fill it.
- **6.3** Finish and generate → documents page with **two sets**.
- **6.4** Documents labelled **"— You"** and **"— Your spouse"** (and "— Joint"
  for a trust).
- **6.5 Mirror wills** — your will leaves to your spouse + names them executor;
  your spouse's mirrors it (leaves to you). _Expect:_ names correct both ways, no
  blank "[Spouse]" placeholders.
- **6.6 Couples trust** — ONE joint trust naming both, plus a pour-over will +
  directives for each person.
- **6.7 Directives** — each spouse's POA/healthcare names the other as agent.

## 7. Trust interview
- **7.1** Trustee + successor-trustee fields appear (they don't for a Will).
- **7.2** Generate → trust + pour-over will + POA + healthcare + HIPAA.
- **7.3** Trust funding tracker available from the documents page.

## 8. Your documents
- **8.1 Download a DOCX** → opens in Word; name/state/beneficiaries correct.
- **8.2 Draft stamp** on every page: "DRAFT — ATTORNEY REVIEW REQUIRED."
  _Heads-up:_ correct until counsel signs off.
- **8.3 Execution instructions** — state-specific signing steps.
- **8.4 Update & regenerate** — change an answer; new doc reflects it.
- **8.5 PDF button** — _Heads-up:_ not wired up yet; DOCX only. Not a bug.

## 9. Membership perks
- **9.1 Vault** — upload a file, download it back intact.
- **9.2 Annual estate checkup** — saves answers.

## 10. Dashboard & account
- **10.1 Dashboard** lists matters + status.
- **10.2 Account settings** — view/edit details.
- **10.3 Account deletion** — _careful:_ throwaway account only; real deletion
  after a confirmation step.

## 11. On your phone
- **11.1** Sign up + short interview on mobile — readable, tappable, no overflow.

## 12. Your marketer's eye
- **12.1** Note typos, awkward wording, confusing/slow steps, anything off-brand —
  as valuable as bugs.

---

## Not ready yet — don't file as bugs
- **Paying by card / subscribing** — Stripe not connected; buttons disabled on
  purpose.
- **Access unlocking after a card payment** — needs Stripe.
- **"Documents ready" emails** — email not connected; UI may say sent, nothing is
  delivered.
- **PDF downloads** — DOCX only for now.
- **Admin area** — unless granted admin access.
- **Final legal wording** — all legal/Terms/Privacy text is placeholder pending
  counsel.
