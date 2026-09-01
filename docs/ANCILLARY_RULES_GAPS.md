# Ancillary execution rules — what the model cannot yet hold

**Status: decisions needed, from Dave and then from counsel. Nothing here is legal advice, and nothing here has been entered into `state_rules`.**

The rules layer can now hold execution formalities for the trust, the durable financial power of attorney and the advance healthcare directive, per state and per instrument (migration 0017, plus `hasRecordedRules`). Documents in a state with rows print them; documents in a state without keep failing closed, and a state flips on its own the moment rows land.

The shelf is built. This document is about why it is still empty.

`docs/STATE_COMPLIANCE_DOSSIER.md` §4 already contains researched POA and healthcare findings for **CA, FL, NV and AZ**. Three of those four do not fit the shape the rules layer can express, and forcing them in would mean choosing a legal reading. That choice is not a product decision and it is not one a non-lawyer should make silently in a seed file, so the findings are written up here instead.

---

## What the rules layer can express today

Per (state, instrument), exactly two things drive an execution block:

| Rule key | Meaning |
|---|---|
| `witnesses_required` | `{ "count": n }` → n witness lines |
| `notarization_required_for_document` | `{ "required": bool }` → a notary line, or none |

That is a **conjunction of fixed counts**. Everything below breaks it.

---

## 1. California — a disjunction the model could not represent ✅ SHAPE BUILT

Dossier §4: financial POA is **notary *or* two witnesses**, with a notary required for the § 4401 safe-harbour form.

There was no value of `witnesses_required` + `notarization_required_for_document` that means "either of these". The three ways to force it are all wrong:

- `{witnesses: 2, notary: false}` — drops the safe harbour, and the safe harbour is where § 4406's duty to accept comes from
- `{witnesses: 0, notary: true}` — asserts a notary requirement that does not exist
- `{witnesses: 2, notary: true}` — demands more than the law does, which is safe for validity but tells the customer something untrue about their own state

**Resolved as a shape.** A new rule key holds a genuine either/or:

```json
{"any_of": [{"witnesses": 2, "notary": false}, {"witnesses": 0, "notary": true}]}
```

Where present it replaces the two older keys for that instrument, and the document prints **both branches, labelled**, with an instruction to complete exactly one — rather than merging them (which would overstate the law) or silently picking one (which is a legal choice, not a formatting one). No schema migration was needed: `rule_key` is free text and `state_rules_instrument_scope_chk` already forces an instrument. Verified storable against PostgreSQL 16.

**California is still NOT seeded**, because the shape is not the whole problem. The branches are not equivalent in consequence: only the notarized route carries § 4406's duty to accept, so a customer who picks the witness branch gets a valid POA with no acceptance remedy. The generated block says the choice can affect acceptance and to confirm it with an attorney, but *which branch this product should steer a California customer toward* is a legal judgment.

**Decision needed from counsel:** whether California should offer both branches, or only the notarized one.

## 2. Nevada — valid, and unprotected

Dossier §4: a Nevada financial POA needs **a signature**. Notarisation is **optional but decisive** — NRS § 162A.370's acceptance regime, with its 10/5 business-day limits and fees for wrongful refusal, applies **only to an "acknowledged" POA**.

Recorded literally (`witnesses: 0`, `notary: false`) the generated document is a valid Nevada POA with a bare signature line, and a bank may refuse it with no consequence. The rules layer has no concept of "not required, but you will regret omitting it."

**Decision needed:** whether the rules layer should ever record a *recommended* formality distinct from a *required* one. That is a real modelling question with an obvious abuse risk — a "recommended" notary is one careless refactor away from being printed as required.

## 3. Arizona — a correct signature block on an incomplete document

Dossier §4: **one witness AND a notary**, and the witness may not be the agent, the agent's spouse, the agent's children, or the notary. A.R.S. § 14-5501(D)(4) also prescribes **mandatory notarial certificate wording**.

The counts fit the model. The rest does not:

- the witness-eligibility restriction cannot be attached to a witness line
- the mandatory certificate text is statutory language, and this codebase does not draft statutory language

Seeding AZ would produce a correct `1 witness + notary` block on a document still missing text the statute requires. Dossier §4 already calls Arizona "the worst combination": no published form, the most prescriptive ritual of the four, and no statutory recourse if a bank refuses.

## 4. Florida — the superpowers trap ✅ SEEDED AS THE PILOT

Dossier §4: **two witnesses AND a notary**. This one fits cleanly, and is now the
one seeded ancillary jurisdiction.

Verified against Florida's own publisher rather than the dossier alone —
Fla. Stat. § 709.2105 requires the POA to be *"signed by the principal and by two
subscribing witnesses"* and *"acknowledged by the principal before a notary public
or as otherwise provided in s. 695.03"*. Both rows carry that citation and stay
`needs_review = true`.

Every other state's POA continues to fail closed, which is the whole point of
per-state scoping: this list grows one counsel-approved jurisdiction at a time and
no code changes when it does.

But Fla. Stat. § 709.2202 requires the principal to **sign or initial next to each enumerated "superpower"** — gifting, beneficiary changes, survivorship changes, trust powers — and the dossier calls this the most common Florida invalidation trap. Nothing generates those per-power initial lines.

Florida is the strongest candidate for seeding, because the execution block would be right and printing it is strictly better than the current fail-closed marker. It would still not make the document shippable.

## 5. Healthcare directives — conditional on the signer, not the state

Cal. Prob. Code § 4675: if the patient is in a **skilled nursing facility**, a patient advocate or ombudsman must also witness, or the directive is **not effective**.

This is not a property of California. It is a property of *where the signer is living when they sign*, which the interview does not ask. No per-state witness count can capture it. Same shape: Nevada requires a competency certification from an APRN, physician, psychologist or psychiatrist when the principal resides in a hospital, group residential facility, skilled nursing facility, or home for individual residential care — for **both** financial and healthcare POAs.

**Decision needed:** whether conditional formalities belong in `state_rules` at all, or in the interview as a branch that changes which document is produced.

---

## Recommendation — progress

1. ~~**Extend the rule shape for disjunctions first.**~~ ✅ **Done.** `execution_alternatives`, with both branches printed and labelled.
2. ~~**Seed Florida POA alone as the pilot.**~~ ✅ **Done**, cited to Fla. Stat. § 709.2105 and verified against the state's own publisher.
3. **Treat the content gaps as separate work from the execution gaps.** Still open. § 709.2202 initialing and § 14-5501(D)(4) certificate text are document-body problems. The execution block being right does not touch them, and `recordedExecutionNotice` says so on the **trust, POA and healthcare directive**.

   **Correction (31 Aug 2026):** an earlier draft of this line claimed the notice appears on *"every document that derives a block"*. It does not. The **will and the pour-over will** derive their blocks from state rules and carry no such notice — they always have, and this work did not change them. The gap matters on its own terms: the notice's central warning is that *who may serve as a witness* is not generated, and interested-witness disqualification is a will problem far more than a POA problem.

   **Decision needed:** whether the will and pour-over will should carry an equivalent notice. It would change every will generated in all 51 jurisdictions, so it is a product call rather than a bug fix.
4. **Do not seed AZ or NV** until 3 is settled. Unchanged.
5. **New:** California is now *representable* but still not seeded — the shape is built, the legal choice between its two branches is not ours. See §1.

### What unblocks the remaining forty-six states

Nothing structural, for a conjunction state. Adding a jurisdiction is now a
`ANCILLARY` entry in `scripts/gen-state-seed.mjs` plus a citation, and the state
flips itself on. What it needs is the **research**, sourced from each state's own
publisher per `docs/CLAUSE_RESEARCH_METHOD.md`, and counsel's sign-off — not
engineering.

## What counsel decides, not us

- Whether California's safe-harbour form should be offered at all, given the dossier's provenance warning: the § 4401 text is not published on the state's own site, and every online copy is a secondary transcription of AB 1082 (2011).
- Whether a Nevada POA should be generated at all without an acknowledgment.
- Whether Arizona should be excluded from the POA product until the certificate text exists.
