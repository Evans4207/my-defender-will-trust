# Client Info → Salesforce (CRM) — Design Notes

**Status:** Planned / not built. Post-launch work — no dependency on the current
launch. Captured 2026-07-20 so we design for it now.

**Decision in one line:** Salesforce should be fed **from our own app (Supabase)**
on lifecycle events — **not** primarily from Stripe. Stripe supplies *payment
status*, not *client identity*.

---

## What the app captures today (verified in code)

| Source | Fields | Who it covers |
|---|---|---|
| **Signup** (Supabase Auth — `signup-form.tsx`) | **Full legal name + email** (+ password) | **Everyone** — direct payers *and* partner-code users — captured *before* payment |
| **Waitlist** (`waitlist-form.tsx`) | Email + state | Leads in not-yet-open states |
| **Interview** | Name, family, fiduciaries, assets, etc. | Paying/active clients — **sensitive PII; document contents** |
| **Stripe** | Name + email + billing address | **Only the subset who pay by card** |

- **No CRM/Salesforce integration exists yet.**
- **No client contact *phone number* is captured anywhere today** — only email.

Our own database is the authoritative, complete source of client identity. Stripe
only ever sees payers, and only their billing-grade data.

## Why not Stripe → Salesforce

Piping Stripe into Salesforce would systematically **miss people**:
- **Partner-access-code clients** — redeem a code, never touch Stripe checkout.
- **Waitlist leads** — not customers yet, but prime for marketing follow-up.
- **Signups who don't pay** — abandoned-cart follow-ups.

Stripe's own Salesforce connector recreates this same gap, so it is **not** the
primary path.

## Recommended architecture

Sync **from the app to Salesforce on lifecycle events**, pushing only contact +
commercial fields:

| Trigger event | Salesforce object | Fields |
|---|---|---|
| Account created | **Lead** | Name, email, state, source (partner code / direct) |
| Checkout completed *or* code redeemed | Convert to **Contact / Customer** | + plan (Will/Trust), status |
| Joins waitlist | **Lead** | Email, state, `waitlist` tag |

### Data minimization (important)
**Only** contact + commercial fields leave the app. **Never** send will/trust
document contents, beneficiaries, or asset details — that highly sensitive family
data stays in our private storage and out of the CRM.

## Build options

1. **Native / server-side (recommended long-term):** the app calls the Salesforce
   REST API when these events fire (Supabase trigger or server action + Stripe
   webhook we already have). Most control and reliability; needs a Salesforce
   "connected app" + dev work.
2. **Low-code middleware (fastest to start):** Supabase + Stripe events → Zapier /
   Make → Salesforce. Marketing-team-friendly, small monthly fee.
3. **Stripe Salesforce connector:** not recommended as primary — payers only.

## Open decisions

- **Reach out by phone?** If yes, add an **optional phone field** at signup (only
  email exists today). Small change; do it before launch if phone outreach matters.
- **Lead vs. customer lifecycle** — every signup as a Lead, or only paid/redeemed
  clients as Contacts? Shapes the sync triggers.
- **Build option** — native (1) vs. middleware (2).

## Compliance / consent (attorney review)

Terms/Privacy are still `[ATTORNEY REVIEW REQUIRED]`. Sending client data to
Salesforce (a third party) **must be disclosed in the privacy policy and cleared by
counsel** before it ships. Flag to counsel during the existing legal review so it's
covered, not bolted on later.

## Next steps (when ready)

1. Decide the three open items above.
2. If phone outreach is wanted, add the optional signup field.
3. Turn this into a proper build phase: event triggers, exact field mapping,
   Salesforce object model, and the chosen integration path.
