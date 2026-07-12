# State rules — QA reference (Phase 6)

All 51 US jurisdictions are seeded in `state_rules`. Execution formalities were
researched against current statutes (July 2026) and citations are recorded in
each row's `citation` field. **Every row is `needs_review = true`** and every
`state_availability` row is `qa_approved = false` — counsel must sign off per
state before it's considered cleared (availability is a separate, owner-set
toggle; see below).

Regenerate the seed from `scripts/gen-state-seed.mjs` (`node scripts/gen-state-seed.mjs`).

## Availability (owner decision)
Live now: **all jurisdictions except** the high-risk excluded set —
**LA, TX, NC, MO, OH**. Louisiana is excluded structurally (civil-law notarial
regime); TX/NC/MO/OH pending counsel review (UPL-enforcement history). Any state
can be enabled later by flipping `state_availability.available` — a config change,
no deploy.

## Notable per-state findings counsel should verify
- **No self-proving affidavit for paper wills:** **OH**, **DC** (DC self-proves
  only for e-wills). Our assembler omits the self-proving section for these.
- **Signature must be at the END:** CT, KY, AR, OK, PA, NY, KS, OH, FL, LA(historically —
  repealed 2025). (Others require a signature but not at the end.)
- **Self-proving WITHOUT a notary** (attestation clause / unsworn declaration):
  IN, IL, MD. NV allows an unsworn declaration.
- **Statutory witness minimum age:** GA 14, LA 16, ID 18, OH 18, TX 14. Others use
  a general "competent/credible witness" standard (no fixed age → `null`).
- **Louisiana (major 2025 change):** Acts 2025 No. 30 (SB 49) rewrote art. 1576 —
  notarial testament still needs a notary + 2 witnesses, but the sign-at-end rule
  was removed. Witness min age 16.
- **Community property (fixed law):** AZ, CA, ID, LA, NV, NM, TX, WA, WI.
- **Electronic wills enacted** (MVP still uses wet signatures everywhere): AZ, FL,
  NV, CO, UT, ND, IN, IL, OK, MO, MD, DC, NC, WA, AK. Stored per-state for later.
- **California:** no classic self-proving affidavit (§8220 governs proof) →
  flagged `uncertain`, needs counsel decision.

## What "QA sign-off" means here
Set `state_availability.qa_approved = true` (and clear `needs_review` on that
state's rules) once counsel confirms the execution formalities, statutory
ancillary forms, and community-property language for that state. The admin
state-rules editor (Phase 7) will drive this workflow.
