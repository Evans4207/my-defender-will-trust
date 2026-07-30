# Test Plan — My Defender Will & Trust

A guided, area-by-area walkthrough for the marketing tester (Donovan). Work top to
bottom; each item has an **Expect** result. Items marked _Heads-up_ are intentional
placeholders, not bugs.

_Updated 30 July 2026. Several things changed in this round — see "What changed since
your last pass" below before you start, because two areas that used to be on this
plan are deliberately gone._

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

## What changed since your last pass

Read this first. It will save you filing bugs on deliberate changes.

**The couples package is switched off everywhere.** Section 6 of the old plan was a
whole couples walkthrough; it is gone. The documents themselves work, but both
spouses' documents would end up in one login, and the second spouse would have no
way to reach their own will — so the tier is closed until each spouse can have their
own account. The About step no longer offers "my spouse or partner and me", the gate
page shows no Couples buttons, and the home page no longer quotes a couples price.
**All of that is correct.** If you find couples offered anywhere, that IS a bug —
please report it.

**Your documents can no longer become unreachable.** Previously access was tied to a
payment status that could change. Now, once you own a document you own it
permanently, and the dashboard will show your existing documents even if you have no
active purchase. New section 13 tests this.

**You can now download everything at once.** New in section 9.

**The vault, checkup and funding tracker need a membership**, and no test account
has one yet. See section 9 — ask Dave to add one to your account if he wants those
tested.

---

## 1. The public website (no login)
- **1.1 Home page loads** — hero, both packages, how-it-works, footer. _Expect:_
  renders cleanly, no broken images. Prices show as "individual" only — **no couples
  price should appear anywhere.**
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
- **4.1 Plan options show** — the access-code path plus both packages, **Individual
  only**. _Expect:_ no Couples button on either package.
- **4.2 Buy buttons disabled** with "card payments being set up." _Heads-up:_
  intentional — must NOT crash.

## 5. Will interview
- **5.1 Step through every question**: state → doc type → about → family →
  fiduciaries → assets → distributions → special → ancillary → review.
- **5.2 The About step's "Who are these documents for?"** should offer **only "Just
  me"**, with a note that joint packages are coming. _Expect:_ no spouse option.
- **5.3 Autosave** — refresh mid-interview; answers retained.
- **5.4 Leave & resume** — dashboard then back; resumes in place.
- **5.5 Validation** — blank required field / beneficiary shares ≠ 100% → clear
  error, can't continue.

## 6. Trust interview
- **6.1** Trustee + successor-trustee fields appear (they don't for a Will).
- **6.2** Generate → trust + pour-over will + POA + healthcare + HIPAA.
- **6.3** Only **one set** of documents, for you. _Heads-up:_ a joint trust naming
  both spouses is part of the couples package, which is switched off.

## 7. Your documents
- **7.1 Download a DOCX** → opens in Word; name/state/beneficiaries correct.
- **7.2 Draft stamp** on every page: "DRAFT — ATTORNEY REVIEW REQUIRED."
  _Heads-up:_ correct until counsel signs off.
- **7.3 Execution instructions** — state-specific signing steps.
- **7.4 Update & regenerate** — change an answer; new doc reflects it.
- **7.5 PDF button** — _Heads-up:_ not wired up yet; DOCX only. Not a bug.
- **7.6 Generation must not error.** If you ever see a message about
  "DISCLAIMER_VERSION", stop and tell Dave immediately — that is a configuration
  problem on the server, not something you did.

## 8. Trust funding tracker
- **8.1** Reachable from the documents page for a trust matter. _Heads-up:_ needs a
  membership — see section 9.

## 9. Download everything (new)
- **9.1** Go to `/account/export` directly in the address bar.
- **9.2** _Expect:_ a ZIP downloads named `my-documents-<date>.zip`.
- **9.3** Open it. It should contain a folder per package with your documents in it,
  plus a `MANIFEST.txt` listing everything and when each was generated.
- **9.4** File names should be readable — "Last Will and Testament.docx", not codes.
- **9.5** This must work **whether or not** you have a membership, and must never
  ask you to buy anything. It is your own data. If it blocks you, that IS a bug.

## 10. Membership perks — needs setup
These three all require an active membership, and **no test account currently has
one**, so you will see a "membership required" upsell instead. That is correct
behaviour, not a bug.

If Dave wants these tested, ask him to add a membership to your account first. Then:
- **10.1 Vault** — upload a file, download it back intact.
- **10.2 Annual estate checkup** — saves answers.
- **10.3 Funding tracker** — loads and saves.
- **10.4** With a membership, the vault should offer a "Download everything" button
  alongside the upload form.

## 11. Dashboard & account
- **11.1 Dashboard** lists matters + status.
- **11.2 Account settings** — view/edit details.
- **11.3 Account deletion** — _careful:_ throwaway account only; real deletion
  after a confirmation step.

## 12. On your phone
- **12.1** Sign up + short interview on mobile — readable, tappable, no overflow.
- **12.2** Check the new export in section 9 on mobile too — note what happens when
  a ZIP downloads on a phone; it may not be usable, and that is worth knowing.

## 13. Access should never strand you (new — worth doing carefully)
This is the area that changed most, and it is hard to test without Dave's help
because it needs your access altered mid-test. Coordinate with him.

- **13.1** With documents already generated, ask Dave to remove your access code
  entitlement. _Expect:_ you can still reach the dashboard, still see your matters,
  and still download your documents. You should NOT be bounced to the sales page.
- **13.2** _Expect:_ the dashboard says something like "Your documents stay available
  to download. Purchase again to make further edits," and the Start/Resume interview
  button is gone while the "View documents" button remains.
- **13.3** `/account/export` should still work in that state.
- **13.4** A brand-new account with no code and no documents should still be sent to
  the plan page. _Expect:_ that one DOES redirect — it is only people with existing
  documents who stay in.

## 14. Your marketer's eye
- **14.1** Note typos, awkward wording, confusing/slow steps, anything off-brand —
  as valuable as bugs.
- **14.2** Particularly: the wording where the couples option used to be, and the
  new dashboard message in 13.2. Both are new copy that has never had a second pair
  of eyes on it.

---

## Not ready yet — don't file as bugs
- **The couples / joint package** — deliberately switched off until each spouse can
  hold their own login. Not a bug anywhere it is absent.
- **Paying by card / subscribing** — Stripe not connected; buttons disabled on
  purpose.
- **Access unlocking after a card payment** — needs Stripe.
- **Refunds removing access** — the logic exists but cannot be exercised without
  Stripe.
- **"Documents ready" emails** — email not connected; UI may say sent, nothing is
  delivered.
- **PDF downloads** — DOCX only for now.
- **Vault, checkup and funding tracker** — need a membership; no test account has
  one. Ask Dave.
- **A help/FAQ page or a contact form** — not built yet. There is currently no way
  to contact support from inside the app; that is known and scoped.
- **Admin area** — unless granted admin access.
- **Final legal wording** — all legal/Terms/Privacy text is placeholder pending
  counsel.

---

## If something looks badly broken
Two symptoms are worth flagging to Dave immediately rather than logging normally,
because they mean a server setting is wrong rather than a feature being unfinished:

1. You are sent to the plan page even though you redeemed a code and previously had
   access.
2. Generating documents shows an error mentioning `DISCLAIMER_VERSION`.
