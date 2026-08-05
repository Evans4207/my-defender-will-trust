# Clause research method — proof of concept

**Status:** proof of concept, one state, one clause.
**Purpose:** show how we move the clause library from blanket placeholder text to
drafted-from-statute text with citations — so counsel reviews a researched draft
instead of a blank page — **without** weakening the rule that nothing ships until
an attorney approves it.

---

## What has NOT changed

- Every clause is still unapproved. `researched` ≠ approved.
- Every generated document still carries `[ATTORNEY REVIEW REQUIRED]`.
- All 51 jurisdictions remain `needs_review = true`, `qa_approved = false`.
- The per-state go-live gate is untouched. Counsel still flips it, per state.

We must never tell a customer, an attorney, or a partner that these documents are
"compliant" or "current" before counsel signs off. What we can say is that they
are **drafted against the governing statute and cited**, which is what makes the
review faster and cheaper — not optional.

## The method

**1. Anchor on the uniform/model act as the national baseline.**
Wills → Uniform Probate Code. Trusts → Uniform Trust Code. POA → Uniform Power of
Attorney Act. Healthcare directive → Uniform Health-Care Decisions Act. HIPAA →
federal (45 CFR § 164.508), so little state variance. Digital assets → RUFADAA.

**2. Layer each state's deviations on top.** Execution formalities (already in
`state_rules`), required notices, interested-witness rules, and above all
**whether the state prescribes a form**.

**3. Classify the state's form requirement — this drives drafting.** Recorded per
clause as `fidelity` in `src/lib/documents/clause-provenance.ts`:

| `fidelity` | Meaning | Drafting rule |
|---|---|---|
| `mandatory_verbatim` | Statute prescribes exact wording | Reproduce the statute verbatim. **Never paraphrase.** |
| `statutory_sample` | Statute gives a sample / "substantially the following form" | Track the statutory elements closely; counsel confirms sufficiency |
| `drafted_from_rule` | No prescribed form | Draft from the governing rule + common practice |

**4. Cite everything.** Each clause records `citation`, `sourceUrl`, `checkedAt`,
`status`, and a `reviewNote` written *for the reviewing attorney*.

**5. Source hierarchy.** (a) state statutes and the state's own published forms;
(b) court / state-bar self-help forms; (c) uniform acts + official comments;
(d) practitioner treatises. Prefer primary sources the attorney can verify in one
click.

## Worked example — Arizona self-proving affidavit

Chosen first because the self-proving affidavit is the highest-value clause in a
will: its wording is statutorily prescribed in most states, and getting it wrong
costs the estate a probate step (tracking down witnesses to testify) even when the
will is otherwise valid.

**Source:** A.R.S. § 14-2504 — "Self-proved wills; **sample form**; signature
requirements" (<https://www.azleg.gov/ars/14/02504.htm>), read 2026-08-05.

**Findings that changed the draft:**

1. **Substantial compliance, not verbatim.** Subsection (A) requires the officer's
   certificate to be "in substantially the following form." Arizona is therefore
   `statutory_sample`, not `mandatory_verbatim` — text tracking the statutory
   elements is the correct target. (A state with a mandatory form would be drafted
   very differently.)
2. **Six facts the witnesses must swear to**, all carried in the draft and unit-
   tested so they cannot silently regress:
   (a) testator signed and executed the instrument as their will; (b) signed
   willingly, or willingly directed another to sign; (c) each witness signed in the
   testator's presence and hearing; (d) testator is eighteen or older; (e) of sound
   mind; (f) under no constraint or undue influence.
3. **Officer's certificate under official seal** — so the execution block carries
   notary title, commission-expiry, and seal lines.
4. Subsection (B) also allows a will to be made self-proved *after* execution; we
   generate the simultaneous-execution form only. Subsection (C) provides a
   signature on the affidavit counts as a signature on the will where needed to
   prove due execution. Both flagged for counsel; neither changes this draft.

**What counsel is asked to confirm** (carried in the clause's `reviewNote`, so it
travels with the text): current statutory text unchanged; the witness paragraph
adequately establishes all six facts; whether to also offer the § 14-2504(B)
after-the-fact variant; and that the notary/seal block matches Arizona practice.

## Where it lives

| File | Role |
|---|---|
| `src/lib/documents/clause-provenance.ts` | Provenance + status model (`placeholder` → `researched` → `attorney_approved`) |
| `src/lib/documents/clauses/self-proving-affidavit.ts` | Researched AZ clause + conservative fallback for every other state |
| `src/lib/documents/clauses/self-proving-affidavit.test.ts` | Tests: six statutory facts present, seal block, fallback stays placeholder |
| `src/lib/documents/will.ts` | Assembler resolves the clause per state (data-driven; no hardcoded state `if`s) |

Unresearched states fall through to a deliberately conservative placeholder that
does **not** attempt statutory language — the fallback only makes the
sworn-vs-unsworn distinction, which is driven by that state's own rule row.

## Honest limits

- **`researched` is unverified desk research.** The citations exist so counsel
  verifies against the *current* code, not so anyone skips that step.
- **Statutes change.** `checkedAt` ages; a clause is only as good as its last check.
- **Mandatory-form states are the hard part.** Where a state prescribes exact
  wording, the compliant text is the statute's own words and must be transcribed
  verbatim from an authoritative source — ideally supplied or confirmed by counsel,
  or pulled from a paid legal database. Paraphrase there is a defect, not a style
  choice.
- This method was **not** applied by a lawyer and is not legal advice.

## Scaling from here

Do launch states first, highest-liability clauses first:

1. Will execution + self-proving affidavit (per launch state)
2. Any state where the POA / advance-directive form is **mandatory** — the
   `mandatory_verbatim` cases, which carry the most risk and the least drafting
   latitude
3. Trust core clauses (revocability, trustee powers, successor trustee)
4. Everything else

Each state ships only when counsel approves it and flips `qa_approved` — which is
exactly what the per-state model was built for.
