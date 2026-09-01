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

## 1. California — a disjunction the model cannot represent

Dossier §4: financial POA is **notary *or* two witnesses**, with a notary required for the § 4401 safe-harbour form.

There is no value of `witnesses_required` + `notarization_required_for_document` that means "either of these". The three ways to force it are all wrong:

- `{witnesses: 2, notary: false}` — drops the safe harbour, and the safe harbour is where § 4406's duty to accept comes from
- `{witnesses: 0, notary: true}` — asserts a notary requirement that does not exist
- `{witnesses: 2, notary: true}` — demands more than the law does, which is safe for validity but tells the customer something untrue about their own state

**Decision needed:** extend the rule shape to carry alternatives (for example `{"any_of": [{"witnesses": 2}, {"notary": true}]}`), or leave California failing closed. Extending is the honest fix, and CA is unlikely to be the only disjunction among 51 jurisdictions.

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

## 4. Florida — the superpowers trap

Dossier §4: **two witnesses AND a notary**. This one fits cleanly.

But Fla. Stat. § 709.2202 requires the principal to **sign or initial next to each enumerated "superpower"** — gifting, beneficiary changes, survivorship changes, trust powers — and the dossier calls this the most common Florida invalidation trap. Nothing generates those per-power initial lines.

Florida is the strongest candidate for seeding, because the execution block would be right and printing it is strictly better than the current fail-closed marker. It would still not make the document shippable.

## 5. Healthcare directives — conditional on the signer, not the state

Cal. Prob. Code § 4675: if the patient is in a **skilled nursing facility**, a patient advocate or ombudsman must also witness, or the directive is **not effective**.

This is not a property of California. It is a property of *where the signer is living when they sign*, which the interview does not ask. No per-state witness count can capture it. Same shape: Nevada requires a competency certification from an APRN, physician, psychologist or psychiatrist when the principal resides in a hospital, group residential facility, skilled nursing facility, or home for individual residential care — for **both** financial and healthcare POAs.

**Decision needed:** whether conditional formalities belong in `state_rules` at all, or in the interview as a branch that changes which document is produced.

---

## Recommendation

1. **Extend the rule shape for disjunctions first.** It unblocks California, and CA will not be the last.
2. **Seed Florida POA alone as the pilot** (`witnesses: 2`, `notary: true`, cited to Fla. Stat. § 709.2105, `needs_review = true`), and confirm the end-to-end path works with one real state before doing forty-seven.
3. **Treat the content gaps as separate work from the execution gaps.** § 709.2202 initialing and § 14-5501(D)(4) certificate text are document-body problems. The execution block being right does not touch them, and `recordedExecutionNotice` says so on every document that derives a block.
4. **Do not seed AZ or NV** until 1 and 3 are settled.

## What counsel decides, not us

- Whether California's safe-harbour form should be offered at all, given the dossier's provenance warning: the § 4401 text is not published on the state's own site, and every online copy is a secondary transcription of AB 1082 (2011).
- Whether a Nevada POA should be generated at all without an acknowledgment.
- Whether Arizona should be excluded from the POA product until the certificate text exists.
