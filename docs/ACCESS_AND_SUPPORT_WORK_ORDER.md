# Work Order — Sharing, Legacy Contact, Support and FAQ

Four pieces of work that together close the access gap, give the product a support
channel it has never had, and reopen the couples tier.

Scope decided 2026-07-29. Build in the order below — the dependencies are real.

**Why this phase exists.** The product can generate a complete estate plan and has
no way to get it to anyone but the buyer. There is no sharing, no post-death
access, no FAQ, and no contact route of any kind — the only marketing pages are
home, states, find-an-attorney, terms and privacy. Trust & Will, which uses the
same one-login-per-account architecture we do, closes the same gap with exactly two
features: lifetime sharing where the recipient creates their own account, and a
legacy contact released on proof of death. That pair is what makes a shared login
defensible, and it is what P2 and P3 below build.

---

## 0. Decisions already made

| Decision | Choice |
|---|---|
| Legacy contact release trigger | **Proof of death, verified by a human on our side.** Not an owner-veto timer. |
| Couples tier | **Reopen in this phase**, with a disclosure and a logged acknowledgment. |
| Support channel | **In-app form writing to a `support_requests` table**, with attachments. |
| FAQ | **Full draft answers**, every one gated behind a review flag. |

### Why proof of death rather than a timer

Everplans releases on a deputy clicking "report as deceased" plus the owner failing
to answer an email inside a window they chose (three hours to thirty days), with no
death certificate anywhere in the flow. It is elegant and needs no staffing, but
nobody ever verifies that the owner died, and their documentation describes no
separate incapacity path — so an owner who is alive but incapacitated and unable to
check email has the switch tripped on them. For a company whose product is legal
documents, releasing an estate plan on an unverified assertion is the wrong risk to
take. Trust & Will requires proof of death and identity reviewed by their support
team; Apple requires a death certificate plus human review. We follow those.

### Reopening couples — the accepted exposure, stated once

Sharing and a legacy contact fix the death case: the surviving spouse can be given
live access while both are alive, and can claim access afterwards. They do **not**
fix separation or divorce, where one party keeps a login holding both parties'
documents and there is no severance path. No competitor documents one either —
Trust & Will carries the identical exposure and HelloPrenup, which does give each
party their own login, publishes nothing about unilateral deletion or export on
dispute. Reopening the tier before counsel has cleared the disclosure copy accepts
that risk knowingly. Section 5 makes the acknowledgment a logged record so that if a
survivor or an ex-spouse ever complains, there is evidence of what the buyer was
told. Get counsel to that copy early even though the tier is going live first.

---

## 1. P1 — Support channel and the FAQ shell

Do this first. No schema risk, and everything else needs somewhere for a customer
to write to. A legacy-contact claim arrives through this form, so it has to accept
an unauthenticated submission with a file attached.

### Schema

```sql
support_requests (
  id                    uuid pk,
  user_id               uuid null references auth.users on delete set null,
  email                 text not null,        -- claimants have no account yet
  matter_id             uuid null references matters on delete set null,
  category              support_category not null,
  subject               text not null,
  body                  text not null,
  attachment_path       text null,            -- private bucket
  status                support_status not null default 'new',
  handled_by            uuid null references auth.users,
  handled_at            timestamptz,
  internal_note         text,
  created_at            timestamptz not null default now()
)
```

`support_category` should include `legacy_access_claim` as its own value — that is
the routing signal for the P3 review queue.

RLS: a submitter reads only their own rows (`user_id = auth.uid()`); admins read
all. Anonymous submissions insert through a server action, never a client-side
insert.

### Requirements

- `/support` page plus a footer link. There is no footer contact link today; add one.
- Works logged out. Rate-limit it with the existing `checkRateLimit` helper — the
  same pattern as code redemption. An unauthenticated form with a file upload is an
  abuse target.
- Attachments: cap the size, restrict the types, store in the private documents
  bucket under a `support/` prefix, never serve them except to an admin through a
  signed URL.
- Notify the operator by email using the existing Resend wrapper, which already
  no-ops with a log line when `RESEND_API_KEY` is unset. Do not make the form
  depend on email being configured.
- **The scripted boundary.** A short set of approved sentences support may use, and
  a hard rule that anything resembling "which should I choose" or "what should I do
  about my situation" gets the boundary line plus a link to `/find-an-attorney`.
  Put the script in the repo as content, not in someone's head — it is checklist
  item C7 and it is what keeps a support reply from becoming legal advice.

### FAQ shell

Content as a typed module in the repo, not a CMS, so counsel can review a diff:

```ts
type FaqEntry = {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  reviewStatus: "draft" | "approved";
}
```

Follow the `DISCLAIMER_VERSION` pattern: **an entry with `reviewStatus: "draft"`
must not render in production.** Same discipline as the attorney-review
placeholders — the safeguard is in the code, not in a promise to remember.

Categories, and roughly what belongs in each:

| Category | Covers |
|---|---|
| Getting started | what this is, who it suits, how long it takes |
| What you get | the documents in each plan, what a plan does not include |
| Accounts and access | **the new material** — spouse access, sharing, legacy contact, what happens if I die |
| Your state | why some states are unavailable, witnesses, notarisation, self-proving affidavits |
| Signing and storing | execution instructions, where to keep the original, do you need to send it back |
| Membership | what the $49 buys, what happens when it lapses, the vault, exporting everything |
| Pricing and refunds | prices, couples, partner codes, refund policy, what a refund does to access |
| What we cannot do | not a law firm, no advice, cannot tell you which product to choose, find an attorney |

Target 35–45 entries. Add `FAQPage` JSON-LD — harmless while indexing is off and
ready when the two noindex switches flip. Search-driven questions are the strongest
organic asset in this category; write them now.

**Write the answers before building P2 and P3.** Drafting "can my spouse log in?"
honestly is the fastest way to find out what sharing actually has to do. If an
answer is embarrassing to write, that is the spec talking.

---

## 2. P2 — Lifetime sharing

The owner grants a named person read-only access while alive. This is the feature
that makes the shared-login couples model workable, and it serves executors,
healthcare agents, trustees and guardians at the same time.

### Schema

```sql
document_shares (
  id                 uuid pk,
  owner_user_id      uuid not null references auth.users on delete cascade,
  recipient_email    text not null,
  recipient_user_id  uuid null references auth.users on delete set null,
  role_label         share_role not null,   -- spouse, executor, healthcare_agent,
                                            -- trustee, guardian, advisor, other
  matter_id          uuid null references matters on delete cascade,  -- null = all
  invite_token_hash  text not null,
  invited_at         timestamptz not null default now(),
  accepted_at        timestamptz,
  expires_at         timestamptz,           -- invite expiry, not access expiry
  revoked_at         timestamptz,
  revoked_reason     text
)
```

### Requirements

- **The recipient creates their own account.** The invite is bound to the email it
  was sent to; on acceptance, `recipient_user_id` is set. This is how Trust & Will
  does it, and it matters: access is then attached to an authenticated identity, not
  to whoever holds a link.
- Invite expires if unaccepted. Trust & Will's window is thirty days; match it.
- **Read-only, enforced in RLS, not in the UI.** Add a `security definer` helper —
  `public.has_share_access(matter_id uuid)` — that checks for an accepted, unrevoked
  share for `auth.uid()`, and use it in a `FOR SELECT` policy on `matters` and
  `documents`. Do not widen the existing `FOR ALL` policies, and do not route shared
  reads through the service-role client: a service-role read bypasses RLS entirely
  and one mistake there leaks every customer's documents. Keep the authorisation in
  the same place the rest of the app keeps it.
- **Share unsigned copies only.** Trust & Will shares "an unsigned copy of your
  estate plan documents" and that looks deliberate — a shared PDF should not be
  mistakable for the executed instrument. Follow it, and flag the choice for counsel
  rather than deciding it in code.
- Revocable at any time by the owner, immediately.
- **Every access by a share recipient writes to `audit_log`.** Cheap now, and the
  only way to answer "who saw this and when" later.
- Recipient view is its own route (`/shared`), listing the plans shared with them.
  It must be obvious whose plan they are looking at and that it is read-only.
- Reuse the existing signed-URL download pattern; the authorisation check changes,
  the storage path handling does not.

### Exit test

The owner invites a spouse by email. The spouse creates their own account, accepts,
signs in, sees the owner's unsigned plan, and can download it. They cannot edit,
delete, or start an interview. The owner revokes; the next request 404s. `audit_log`
shows the accept, each view, and the revocation.

---

## 3. P3 — Legacy contact

A designation made while the owner is competent, released after death on documentary
proof reviewed by a human. Depends on P2's read path and P1's support form.

### Schema

```sql
legacy_contacts (
  id             uuid pk,
  owner_user_id  uuid not null references auth.users on delete cascade,
  full_name      text not null,
  email          text not null,
  relationship   text,
  is_primary     boolean not null default true,
  designated_at  timestamptz not null default now(),
  revoked_at     timestamptz
)

legacy_access_claims (
  id                 uuid pk,
  owner_user_id      uuid not null references auth.users on delete cascade,
  legacy_contact_id  uuid null references legacy_contacts on delete set null,
  claimant_email     text not null,
  support_request_id uuid null references support_requests,
  evidence_path      text,                  -- death certificate, ID
  status             claim_status not null default 'submitted',
  reviewed_by        uuid null references auth.users,
  reviewed_at        timestamptz,
  decision_note      text,
  access_granted_at  timestamptz,
  access_expires_at  timestamptz
)
```

### Requirements

- **Revocability is load-bearing, not a nicety.** RUFADAA's online-tool rule only
  outranks a will where "the online tool allows the user to modify or delete a
  direction at all times." If we ever lock a designation, we forfeit the priority
  that makes the feature worth having. Never gate editing or deleting a designation
  behind a subscription, a matter status, or anything else.
- **Surface the conflict with the will.** Because the designation outranks the will
  for account access, a customer whose will names a different person has created a
  conflict. Show that plainly at designation time and record the acknowledgment.
  This is checklist item F2 and it needs counsel's wording.
- Allow up to three contacts, each claiming independently. Trust & Will allows
  exactly one, which is a single point of failure; Everplans explicitly recommends
  backups.
- **Do not notify the designated person by default.** Telling someone they have been
  named discloses the existence and contents of an estate plan. Give the owner an
  explicit opt-in to notify. Checklist item F3.
- Claim flow: the contact submits through `/support` with category
  `legacy_access_claim`, attaching a death certificate and their ID. That creates the
  claim row. No self-service unlock exists.
- **Admin review queue.** An admin sees pending claims, the evidence, and the
  designation on file, and approves or denies with a note. Approval grants read-only
  access using the same mechanism as P2. Denial records a reason.
  - While building this, add the audit rule from checklist F8: **any admin view of a
    customer document writes to `audit_log`.** This is the natural moment.
  - Publish what evidence is acceptable. Trust & Will says only "proof of death and
    identity" and does not specify — do better, because an unspecified standard is
    one the reviewer invents under pressure.
- **Bound the access window.** Apple expires legacy access three years after
  approval; Everplans gives deputies twelve months. Set `access_expires_at` at
  approval, default twelve months, extendable by request. Indefinite access to a
  dead customer's records is a liability with no upside.
- Scope on approval: unsigned generated documents, the contact details of named
  persons, and vault uploads. Mirror Trust & Will, and get it confirmed.
- **Death certificates are sensitive third-party data.** They can carry cause of
  death. Store them under their own prefix, admin-only through signed URLs, with an
  explicit retention rule, and name the practice in the privacy policy. This is a
  new data category the current policy does not contemplate.

### Exit test

The owner designates a contact and edits it, then deletes it, with no gate anywhere.
Re-designates. Nothing is emailed to the contact unless the owner opts in. After the
owner is marked deceased, the contact submits a claim with an attachment; an admin
sees it in the queue, approves it, and the contact reaches the unsigned plan
read-only and nothing else. The grant expires on schedule. `audit_log` records the
designation, the claim, the admin's review, the admin's view of any document, and
each subsequent access.

---

## 4. P4 — Reopen the couples tier

Small, once P2 and P3 are live.

- Flip `COUPLES_TIER_OPEN` in `src/lib/features.ts`. One flag drives the checkout
  tier, the interview question and the server-side coercion in `generate.ts` — no
  other code changes.
- Set `STRIPE_PRICE_WILL_COUPLES` and `STRIPE_PRICE_TRUST_COUPLES`, then verify with
  `npm run check:env --couples`.
- **Disclosure plus a logged acknowledgment.** At checkout and again in the
  interview, state plainly that a couples plan is one account with one login holding
  both spouses' documents, and that the second spouse reaches their documents through
  sharing or, after death, through the legacy contact. Require an affirmative
  checkbox and write it to `disclaimer_acknowledgments` under its own version string.
  A survivor who cannot get in will ask what they were told; this is the answer.
- Prompt the buyer to invite their spouse via P2 immediately after purchase. The
  mitigation only works if it is actually used, so make it part of the flow rather
  than a setting to discover.
- FAQ entry answering "can my spouse have their own login?" honestly.
- Revisit `assertPartyAvailable` — the test in `features.test.ts` is written against
  the flag rather than hardcoded, so it flips with it.
- Still open after this ships, and worth scoping separately: tying the interview's
  `party` answer to the tier actually purchased, so an individual buyer cannot select
  couples. The coercion currently forces `individual` while the tier is closed; once
  it reopens, that check has to compare against the purchase.

---

## What this adds to the counsel review

New items for `docs/LEGAL_REVIEW_CHECKLIST.docx`, all of them blocking their own
feature rather than the whole launch:

1. Sharing scope — unsigned documents only, and whether a recipient may retain what
   they downloaded after revocation.
2. Legacy-contact designation language, and the RUFADAA online-tool conflict
   interstitial.
3. Acceptable evidence of death and identity, and who may review it.
4. Death-certificate retention and disclosure in the privacy policy.
5. Couples shared-login disclosure copy and its acknowledgment version.
6. All FAQ answers, as one batch, with the review flag flipped per entry.
7. The support boundary script and the escalation rule.
8. Whether prevailing industry practice is any defence on the separation and divorce
   case, where the entire market is silent rather than solved.

---

## Sequencing and rough size

| Phase | Depends on | Size | Notes |
|---|---|---|---|
| P1 support + FAQ shell | — | small | One table, one page, one form, content module |
| P1 FAQ answers | shell | medium | 35–45 entries; the forcing function on P2/P3 |
| P2 sharing | P1 form for invites | medium | RLS helper is the careful part |
| P3 legacy contact | P2 read path | **largest** | Admin review queue is most of it |
| P4 couples reopen | P2, P3 | small | Flag, prices, disclosure, acknowledgment |

Two things to get right rather than fast: the RLS helper in P2, because that is where
a mistake exposes every customer's documents, and the evidence standard in P3,
because an unwritten standard becomes whatever the reviewer decides in the moment.
