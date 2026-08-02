# Pending Corrections — deferred while the site is in test

Dave's call, 2 August 2026: the product is mid-test with Donovan, so these known
errors are **recorded now and pushed later** rather than landing mid-test. Each
item says exactly what is wrong, where, and what the fix is, so any session can
pick this file up cold and push the change.

When these are fixed, delete this file and tick the LAUNCH_TODO line that points
here.

---

## 1. The false statutory-form sentence on generated documents — highest priority

**File:** `src/lib/documents/ancillary.ts`, `statutoryNote()` (~line 17).

Every generated power of attorney, healthcare directive and HIPAA authorisation
currently prints:

> "Where {State} provides a statutory {kind} form, that form is used verbatim.
> This draft is a general placeholder pending state-specific statutory text."

The first sentence is **false**. No statutory form text exists anywhere in the
codebase for any state — the second sentence admits as much. The document asserts
a compliance property it does not have, on the face of a legal document.

Why it matters beyond tidiness: California's healthcare directive form
(Prob. Code § 4701) and Nevada's POA form are statutory forms that the product
does not use, and the compliance dossier (§5) records that in some states the
statutory form is effectively mandatory. A generated document claiming "that form
is used verbatim" is exactly the kind of statement a UPL or consumer-protection
complaint quotes.

**The fix** (drop-in replacement for the template string):

> "This draft is a general form and has not yet been conformed to any
> state-specific statutory form. Where {State} publishes a statutory {kind}
> form, our attorney review will conform or replace this draft before launch.
> Do not sign this draft."

Keep `ATTORNEY_REVIEW_REQUIRED` prefixed as now. Update any test asserting the
old sentence. One file, one string, low blast radius — but it changes generated
output, which is why it waits for a gap in Donovan's testing.

## 2. Idaho electronic-will seed row is wrong

**Files:** `supabase/seed.sql` (the `('ID', 'will', 'electronic_will_permitted', …)`
row) and `scripts/gen-state-seed.mjs` (the `ID:` entry, which lacks `ewill: true`).

Seeded `permitted: false` with "No e-will statute found — verify". Idaho enacted
the Uniform Electronic Wills Act: Idaho Code Title 15, ch. 2, part 11
(§§ 15-2-1101 et seq.), S1077 (2021), amended S1092 (2023).

Not a launch state, so no urgency — but the row is affirmatively wrong, not
merely unverified. Fix the generator, regenerate the seed, and apply the one-row
update to the hosted project (a single `update`, **not** `db-apply.mjs`, which
resets the schema and destroys test data).

Verified for the record: the three launch-state e-will rows (NV, FL, AZ) and the
Ohio witness-age citation (ORC 2107.06) are **correct as seeded** — an earlier
research pass claimed otherwise against stale data. No change needed there.

## 3. Louisiana witness disqualifiers — a schema gap, not a data error

`state_rules` models witness eligibility as minimum age only. La. Civ. Code
art. 1581 (as amended, Acts 2025 No. 30) also disqualifies a witness who is
insane, blind, or unable to sign their name. Nothing in the product can represent
that today. Handled properly by the schema extension below rather than by
shoehorning it into the age row.

## 4. The compliance schema extension — product dimension + evidence fields

`public.doc_type` is `('will', 'trust')`, so `state_rules` cannot represent the
other products (POA, healthcare directive, and on the Family First side prenup,
postnup, cohabitation, guardianship, pet trust). It also carries no
evidence/verification fields — no source URL, no checked-date/verified-by, no
verification status — so a row's provenance is a comment at best.

The extension is being drafted in the Family First scope (see
`family-first-will-trust/docs/` — research spec + migration draft), because
that suite needs it first for the build. **Port to this repo when the test phase
allows a migration.** Design constraint learned from migration 14: additive only,
applied via a single-migration script, never `db-apply.mjs`.

---

*Cross-references: `docs/STATE_COMPLIANCE_DOSSIER.md` (the research these
corrections came from), `docs/LAUNCH_TODO.md` (the owner-level list), and the
Family First repos for the schema extension draft.*
