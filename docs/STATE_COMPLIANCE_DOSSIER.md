# State Compliance Research Dossier

**Compiled 2 August 2026. Launch states: CA, FL, NV, AZ. Texas researched, not sold into.**

---

## Status of this document — read first

Everything here is **compiled research, not legal advice and not verified**. It was
assembled from primary sources so that counsel's job becomes *verification* rather
than *compilation*, which is the cheapest use of attorney time. Nothing in it may
drive product behaviour until an attorney has signed the specific cell off.

Two categories of information appear below and they must not be conflated:

- **Verifiable fact with a citation** — witness counts, notarisation, whether a
  statutory form exists, waiting periods. Compiled here.
- **Legal judgment** — is this form mandatory in practice, does substantial
  compliance suffice, may we lawfully operate here. **Not** compiled here. That is
  counsel's product.

Provenance caveat throughout: `leginfo.legislature.ca.gov`, `azleg.gov` and
`statutes.capitol.texas.gov` block automated retrieval. California and Arizona text
below came from Justia, public.law or FindLaw; Texas from the Legislative Council
mirror at `tcss.legis.texas.gov`. Florida, Nevada, Ohio and DC came from official
state sources. Counsel should pull CA and AZ text from the official code.

---

## 1. Cross-check of the existing seed data

The 408 seeded `state_rules` rows were checked against primary sources rather than
re-researched.

| Existing claim | Verdict |
|---|---|
| Witness minimum age: GA 14, LA 16, ID 18, OH 18, TX 14 | **Confirmed**, with two corrections below |
| California has no classic self-proving affidavit | **Confirmed**, with a nuance |
| Ohio and DC offer no self-proving affidavit for paper wills | **Confirmed for both** |
| Electronic wills seeded correctly for the launch states | **Confirmed** — NV, FL, AZ carry `permitted: true` with correct citations |
| Electronic wills seeded correctly everywhere else | **One error: Idaho** |

### 1.1 Electronic wills — the seed is right where it matters, wrong for Idaho

*Corrected 2 Aug 2026 against the actual `supabase/seed.sql` at `f167b79`. An
earlier draft of this dossier claimed the seed marked e-wills false everywhere;
that was checked against stale data and was wrong.*

The seed marks 15 jurisdictions `permitted: true` — AK, AZ, CO, DC, FL, IL, IN,
MD, MO, NV, NC, ND, OK, UT, WA — and all three launch-state rows are correct with
correct citations:

- **Nevada** — seeded true, NRS §133.085. Full range: NRS 133.085–133.088,
  133.300–133.340. Added 2001, substantially amended 2017 — the first e-will
  statute in the United States.
- **Arizona** — seeded true, A.R.S. §14-2518. Full range: §§ 14-2518 to 14-2523,
  effective 2019.
- **Florida** — seeded true, Fla. Stat. §732.521+. Full range: §§ 732.521–732.525,
  ch. 2019-71, effective 1 Jan 2020, amended ch. 2021-205.

All three are home-grown statutes, **not** the Uniform Electronic Wills Act.
California (AB 1667 died in 2020) and Texas (Tex. Bus. & Com. Code
§ 322.003(b)(1) excludes wills from UETA) are correctly seeded false.

**The one seed error found: Idaho.** Seeded `false` with the note "No e-will
statute found — verify", but Idaho enacted the UEWA — Idaho Code Title 15, ch. 2,
part 11 (§§ 15-2-1101 et seq., S1077 of 2021, amended S1092 of 2023). Not a launch
state, so no urgency, but the row is wrong and should be corrected when the seed
is next touched.

Product-strategy note stands: e-signature for wills is available in three of four
launch states, under conditions (qualified-custodian and other requirements differ
sharply between NV, AZ and FL — see §4).

### 1.2 Corrections and near-misses on witness rows

- **Ohio witness age** — the seed row is **correct as it stands**: it cites ORC
  2107.06 ("No person under eighteen years of age shall witness a will"), not the
  execution statute 2107.03. An earlier draft flagged this as a likely mis-citation;
  checked against the actual seed, it is not.
- **Louisiana** — 16 is right but incomplete. La. Civ. Code art. 1581 disqualifies a
  witness who is "insane, blind, under the age of sixteen, or unable to sign his
  name." Amended **Acts 2025, No. 30**. The seed only models minimum age, so the
  three other disqualifiers exist nowhere in the product — a schema gap rather than
  a data error, picked up by the schema extension in §9.

### 1.3 The California nuance

Saying "California has no self-proving affidavit" is right in substance but
imprecise. California has no UPC § 2-504 analogue that dispenses with proof. Proof
happens after death under **Cal. Prob. Code § 8220**: a will may be proved on one
subscribing witness, and that evidence may come by affidavit, including "an
affidavit in the original will that includes or incorporates the attestation
clause." So affidavit-based proof is not forbidden — there is simply no
self-proving mechanism at execution.

---

## 2. Can we operate here at all — the regulatory layer

This is the layer that was least documented and it produced the largest surprises.
**Nothing here is a conclusion that the business may or may not operate anywhere.**

### 2.1 Launch states

| | Registration regime | Bond | Express software/publisher exception |
|---|---|---|---|
| **CA** | **Legal Document Assistant**, Bus. & Prof. Code §§ 6400–6415, registered with the **county clerk** | $25k individual; $25k–$100k entities by headcount (§ 6405) | **None.** § 6401 exempts attorneys, government, nonprofits, immigration consultants, process servers — not publishers. § 6400(d) pulls "making published legal documents available" *into* the regulated definition |
| **FL** | **None** | — | Judicial only (*Brumbaugh*, *Furman*, 581 So. 2d 902) |
| **NV** | **Document Preparation Service, NRS ch. 240A**, registered with the **Secretary of State** | $25k individual; **$25k–$200k** entities (NRS 240A.125) | **YES, express** — NRS 240A.030(3)(k) exempts "a person who provides legal forms or computer programs that enable another person to create legal documents" |
| **AZ** | **Certified Legal Document Preparer**, ACJA § 7-208 under Ariz. R. Sup. Ct. 31.3. **Applies to business entities, not just individuals** | **None found** — fees only ($700 initial, 2-yr) | **None.** The certification *is* the safe harbour |

**Nevada's Chapter 240A was not in the picture at all before this research.** It
carries mandatory verbatim advertising text (NRS 240A.150), a physical office sign
(240A.160), a bilingual disclosure statement (240A.180), a 12-point written contract
(240A.190), and a **private right of action for $500 or double damages plus fees**
(240A.300). Whether the 240A.030(3)(k) forms-and-software exemption takes an online
product entirely outside the scheme is exactly the question for counsel — it looks
like the single highest-leverage determination in this whole dossier.

**California § 6408 is worth reading closely.** It requires the registrant's name,
address, telephone, registration number, expiry and county to appear "**as well as on
any Internet Web site maintained by the registrant**." The statute contemplates
online operation by a registered LDA. It does not say whether an out-of-state
online-only provider must register — **not found**, and an open question.

**California § 6410 and § 6411** set out a written-contract regime with 12-point
boldface warnings, a bilingual requirement, a 24-hour rescission right, and a
prohibition on "legal aid"/"legal services" trade names. If the LDA scheme applies,
these are product requirements, not policy documents.

**Cal. Prob. Code § 4128 targets this product category by name** — it mandates a
10-point boldface warning on "a printed form of a durable power of attorney … sold
or otherwise distributed in this state for use by a person who does not have an
attorney," and is **expressly inapplicable to § 4401 statutory-form POAs**. Shipping
the statutory form avoids it; shipping a custom form triggers it.

### 2.2 The four excluded states — the exclusions do not hold up evenly

Currently LA, TX, NC, MO and OH are excluded, the last four on "UPL enforcement
history" with no citation recorded.

**TEXAS — the exclusion is not supported by current law.** Tex. Gov't Code
**§ 81.101(c)**, added by HB 1507 and effective **18 June 1999**, provides that the
practice of law "does not include the design, creation, publication, distribution,
display, or sale, **including publication, distribution, display, or sale by means of
an Internet web site**, of written materials, books, forms, computer software, or
similar products if the products clearly and conspicuously state that the products
are not a substitute for the advice of an attorney." The *Parsons Technology*
(Quicken Family Lawyer) injunction was **vacated by the Fifth Circuit on the same
day**, 179 F.3d 956, expressly because of that amendment. No post-1999 Texas action
against an online document service was found. Texas is now **more permissive than
California, Nevada or Arizona**, all of which require registration. Excluding Texas
while selling into California is internally inconsistent. Texas is roughly 9% of the
US population.

One genuine Texas carve-out survives: **Gov't Code ch. 83** removes instruments
affecting title to real property from the safe harbour where compensation is charged.
That is a product limit on deeds, not a state limit.

**NORTH CAROLINA — legally open, but the conditions are a commercial decision.**
N.C. Gen. Stat. **§ 84-2.2**, enacted 2016 after the LegalZoom consent judgment, is
the only statute in the eight states written specifically to authorise interactive
document-generating websites. It requires State Bar registration (≤$100, the Bar may
not refuse) and seven conditions. Three are commercially material: **a
North-Carolina-licensed attorney must review every blank template including every
conditional clause**; the provider **may not disclaim warranties, limit liability or
cap damages**; and the provider **may not require venue outside North Carolina**.
Those are incompatible with standard SaaS terms. The honest framing is that NC is not
a UPL exclusion — it is an uncapped-liability and template-review-cost decision.

**MISSOURI — the exclusion holds, but for a different reason than recorded.**
Mo. Rev. Stat. § 484.010.2 defines "law business" to include "the drawing or the
procuring of or **assisting in the drawing** … of any paper, document or instrument
affecting or relating to secular rights" — not limited to litigation. § 484.020.2
creates a **private treble-damages action** for everything paid, two-year limitation.
*Janson v. LegalZoom*, 802 F. Supp. 2d 1053 (W.D. Mo. 2011), held the interactive
service was "law business" while blank-form sales were not; settled April 2012 for up
to $6m. Qualifications: *Janson* is a federal *Erie* prediction, not binding Missouri
precedent; *In re Thompson*, 574 S.W.2d 365 (Mo. banc 1978) remains good law and
permits self-help kits absent "personal advice as to legal remedies"; and LegalZoom
continued operating in Missouri after settling. The exposure is class-action-shaped
on gross revenue, and it is architecture-dependent.

**OHIO — a real citable basis, but not "enforcement history."**
UPL Advisory Opinion **2008-03** (12 Dec 2008) states that a non-licensed "online
legal document service … may not draft or prepare legal documents and pleadings, nor
select and complete legal forms for an Ohio resident." Still listed as current, not
withdrawn. But it is **advisory and non-binding**, and **no reported Ohio Supreme
Court decision against an online document service was found**. *Watkins Global
Network*, 2020-Ohio-169, found 1 violation of 31 alleged, which cuts against
categorical treatment. Exposure is ORC § 4705.07(C) private damages plus fees, and
Gov. Bar R. VII(14)(B) civil penalty up to $10,000 per offence.

### 2.3 The calibration problem

**Florida is not excluded, yet on the recorded criteria it is the riskiest of the
eight.** It has the only third-degree **felony** UPL penalty (Fla. Stat. § 454.23),
the only reported injunction against a consumer document-preparation business
(*The Florida Bar v. We The People*, 883 So. 2d 1280 (Fla. 2004) — 22 enjoined
activities, $9,000 penalty), **no registration scheme to opt into**, and mandatory
verbatim disclosure wording (Rule 10-2.1(b), Fam. L.R.P. Form 12.900(a)) drafted for
in-person transactions whose application online is unresolved.

Whatever standard justifies excluding Ohio would, applied consistently, raise a
question about Florida. This is not an argument to exclude Florida — it is an
argument that the exclusion list was not built on a stated standard. **Ask counsel
for the standard first, then apply it to all 51.**

---

## 3. Will and trust execution — launch states

| | CA | FL | NV | AZ | TX |
|---|---|---|---|---|---|
| Witnesses | 2, same time | 2, present to each other | 2 | 2 | 2 |
| Witness min age | none | none | none | none | **14** |
| Beneficiary as witness | allowed; **rebuttable presumption of undue influence**, partial purge | **fully allowed, no purge** | **gift void** unless 2 other witnesses | **prohibited** unless self-proved; also bars devisee's blood/marriage/adoption relatives | gift **void** unless corroborated |
| Signature at end | not required | **required** | not required | not required | not required |
| Self-proving affidavit | **none** (§ 8220 post-death proof) | yes, § 732.503, incl. online notarisation | yes, § 133.050/.055, **declaration under penalty of perjury OR affidavit** | yes, both integrated and separate, § 14-2504 | yes, both, incl. **holographic self-proof** § 251.107 |
| Holographic wills | yes | **no** | yes | yes | yes |
| Electronic wills | **no** | **yes**, § 732.522 | **yes**, NRS 133.085 | **yes**, § 14-2518 | **no** |
| Trust formalities | none | **will formalities required** (§ 736.0403(2)(b)) | none | none, oral trusts valid | writing + settlor signature |
| Community property | yes | **no** (opt-in trust, § 736.1501) | yes | yes | yes |

**Statutory citations:** Cal. Prob. Code §§ 6110, 6112, 6111, 8220, 15206; Fla. Stat.
§§ 732.502, 732.503, 732.504, 732.522, 736.0403; NRS 133.040, 133.050, 133.055,
133.060, 133.085, 163.002; A.R.S. §§ 14-2502, 14-2503, 14-2504, 14-2505, 14-2518,
14-10402; Tex. Est. Code §§ 251.051, 251.052, 251.101, 251.107, 254.002.

### Traps

- **Florida's revocable trust must be executed with will formalities** for a
  Florida-domiciled settlor — two witnesses, signature at end. Unique among the four
  and easy to miss in a shared template.
- **Arizona bars a devisee's relatives from witnessing** for wills executed on or
  after 1 Oct 2019, unless self-proved — but **states no consequence**. Not found.
- **Florida is the only one requiring signature at the end.**
- **Florida does not recognise holographic wills**, and expressly refuses to honour
  an out-of-state holographic will otherwise valid where executed.

---

## 4. Powers of attorney and healthcare directives — the biggest unstarted area

| | Financial POA statutory form | Execution | Duty to accept |
|---|---|---|---|
| **CA** | **§ 4401, safe harbour** | notary **or** 2 witnesses; notary required for the safe harbour | **Yes**, statutory form only, § 4406; refusal "unreasonable" if the only reason is that it is not the third party's own form |
| **FL** | **none** | **2 witnesses AND notary** — strictest | **Yes**, § 709.2120; 4 business days presumed reasonable; **written reasons required**; may not demand its own form |
| **NV** | **NRS 162A.620, safe harbour** | signature; notarisation optional **but decisive** | **Yes**, § 162A.370, 10/5 business days, fees on wrongful refusal — **but only for an "acknowledged" POA** |
| **AZ** | **none**, but § 14-5501(D)(4) prescribes a **mandatory notarial certificate text** | **1 witness AND notary**; witness may not be the agent, agent's spouse, agent's children, or the notary | **Not found** — no duty to accept, no time limit, no remedy |

Healthcare directives: California § 4701, Florida §§ 765.203/765.303, Nevada
§ 162A.860 plus §§ 449A.436/.439, Arizona §§ 36-3224/36-3262 — **all optional or
sample forms**, none mandatory. **No state of the four publishes a HIPAA
authorisation form**; all four regulate content only.

### The live problem in the code

`src/lib/documents/ancillary.ts` prints on every generated POA and healthcare
directive: *"Where [State] provides a statutory form, that form is used verbatim."*
No statutory form text exists for any state and no data records which states have
one. **The document is making a false statement about itself.** That sentence must be
removed or made true before anything else in this section is addressed.

### Traps

- **Arizona is the worst combination**: no published form, the most prescriptive
  execution ritual of the four, and **no statutory recourse if a bank refuses**. The
  classic valid-but-refused scenario.
- **Nevada's acceptance regime only bites on an acknowledged POA**, yet notarisation
  is not required for validity. An unnotarised Nevada POA is arguably valid and gets
  zero protection.
- **Nevada requires a competency certification** from an APRN, physician,
  psychologist or psychiatrist if the principal resides in a hospital, group
  residential facility, skilled nursing facility or home for individual residential
  care — for **both** financial and healthcare POAs.
- **Florida § 709.2202 "superpowers"** — gifting, beneficiary changes, survivorship
  changes, trust powers — require the principal to **sign or initial next to each
  specific enumeration**. The most common Florida invalidation trap.
- **California § 4675** — if the patient is in a skilled nursing facility, a patient
  advocate or ombudsman must also witness or the directive is **not effective**.
  **§ 4673(b)** requires **notarisation for electronic** advance directives; witnesses
  are insufficient. Directly relevant to any e-signature flow.
- **Cal. Civ. Code § 56.11** requires a CMIA authorisation to be **14-point type
  minimum**, "clearly separate from any other language on the same page," and signed
  by a signature "that serves no other purpose." An 11-point authorisation embedded
  in a larger document is defective under state law even if HIPAA-compliant.
- **Florida § 765.110(2)** is the only express "a provider may not make you use its
  own form" rule among the four, at **$1,000 per incident**.
- **California does not publish the § 4401 form on its own website** — leginfo and
  Justia both carry "NOTICE OF INCOMPLETE TEXT." The canonical text is only in the
  chaptered bill, AB 1082 (2011). Every online copy is a secondary transcription.
  A real provenance risk for a product that ships the form.

---

## 5. Pet trusts and guardianship

### Pet trusts

All four states have a statute: Cal. Prob. Code § 15212, Fla. Stat. § 736.0408,
NRS 163.0075, A.R.S. § 14-10408. All terminate on the death of the last covered
animal, none impose a 21-year cap, all permit both inter vivos and testamentary.

**California is the outlier twice.** It is the only one of the four where a court
has **no power to reduce an over-funded pet trust** — the UTC 408(c) excess-value
clause is absent from § 15212. And it is the only one with an affirmative accounting
and inspection regime (§ 15212(e)–(f)), with a **$40,000 de minimis** below which no
filing, registration, accounting or fee is required.

Nevada requires the animal to be **alive at the settlor's death** — NRS 163.0075(1).

### Guardianship — this is where the clause-versus-instrument question lives

Two genuinely different instruments exist and they are easy to confuse:

**(a) Death-triggered:** Cal. Prob. Code §§ 1500/1502; Fla. Stat. § 744.3046
(preneed, **filed with the clerk**, two simultaneous witnesses); NRS 159A.062 (by
will) and new NRS 159A.0753 (standalone notarised form, AB 460, June 2025);
A.R.S. § 14-5202 (by will).

**(b) Effective while the parent is alive:** Cal. Fam. Code §§ 6550–6552 Caregiver's
Authorization Affidavit (**statutory form in § 6552, expressly no notarisation**, no
fixed maximum); Fla. Stat. § 765.2035 (medical only, two witnesses, no notary);
**NRS 159A.205 short-term guardianship — 6 months, parent AND guardian signatures
before a notary, minor aged 14+ must consent, no court**; A.R.S. § 14-5104
delegation of parental powers — **6 months, "properly executed power of attorney,"
no formalities stated**.

Findings that bear directly on the §6.2.2 ruling:

- **California § 1502(b) is the trap.** A "testamentary" guardian nomination in
  California is **not confined to a will and is effective when made**, and may be
  conditioned on the nominator's *absence or incapacity*, not only death. So a
  §1500/1502 nomination can look and function like an alive-effective standby
  instrument while the Fam. Code § 6552 affidavit is the actual private tool. Two
  documents, overlapping triggers, **no statutory conflict rule**.
- **Florida has no true alive-effective instrument.** What exists is medical-only,
  conditional on the parent being unreachable, or court-based. And Florida's
  death-triggered instrument is a **preneed declaration filed with the clerk**, not a
  will clause — a Florida customer who puts a guardian clause only in a will has not
  used § 744.3046 and has not met its witness and filing requirements.
- **"Standby guardian" is not portable.** In Florida it is court-appointed; in
  Nevada the analogue is explicitly non-judicial; California and Arizona have no
  statute using the term for minors.
- **No state of the four has a conflict rule** between (a) and (b), except Nevada
  partially: NRS 159A.205(8)(b) terminates a short-term guardianship on any court
  order appointing a guardian.
- **Recency**: California AB 495 (eff. 1 Jan 2026) amended Fam. Code §§ 6550/6552 and
  Prob. Code §§ 1502/2105. Nevada AB 460 (June 2025) added NRS 159A.0753. Any
  previously drafted content for those two states is stale.

---

## 6. Marital and cohabitation agreements

All four states have adopted the UPAA. None has adopted the UPMAA.

| | CA | FL | NV | AZ |
|---|---|---|---|---|
| Statute | Fam. Code §§ 1600–1617 | § 61.079 | NRS ch. 123A | §§ 25-201–25-205 |
| Waiting period | **7 calendar days ×2, prenup only** | none | none | none |
| Notarisation | no | no | no | no |
| Witnesses | no | **2, for a § 732.702 death-rights waiver** | no | no |
| Disclosure test | fair, reasonable **and full** | fair and reasonable | fair and reasonable | fair and reasonable |
| Independent counsel mandatory | **yes, for spousal support (§ 1612(c))** | no | no | no |
| Postnup scrutiny | heightened if unfair advantage (*Burkle*) | **heightened** (*Casto*, *Petracca*) | **heightened** (NRS 123.070, *Sogg*) | heightened until 11 Sept 2026, **then burden flips** |
| Cohabitation | *Marvin*, express + implied | *Posik*, writing emphasised | *Michoff*, express + implied | *Cook*, **independent consideration required** |

### The findings that change the build

- **California has TWO seven-day clocks, not one.** § 1615(c)(2)(B): seven calendar
  days between first presentation of the **final agreement** and signing, regardless
  of representation. § 1615(c)(1): the advisement to seek independent counsel must be
  given at least seven calendar days **before** signing. Both are calendar arithmetic
  on events the product itself generates. **Neither applies to postnuptial
  agreements** — § 1615 covers only agreements "between prospective spouses."
- **California § 1612(c) is binary and enforceable in software**: any spousal-support
  provision is **unenforceable** if the party against whom it is enforced was not
  represented by independent counsel at signing. Not advisory — a hard interlock.
- **Arizona changes on 12 September 2026**, six weeks from now. HB 2861 (2026 Ariz.
  Sess. Laws ch. 26, signed 7 Apr 2026) adds **A.R.S. § 25-202.01** for postnuptial
  agreements and **reverses *In re Estate of Harber***: the burden moves to the
  challenger, clear and convincing. Agreements signed before and after that date sit
  under different frameworks, and the bill does not address retroactivity — **not
  found**. Any Arizona postnup build needs a date-based branch.
- **Nevada NRS 123A.080(1) reads disjunctively as published** — "(a) … ; (b) The
  agreement was unconscionable when it was executed; **or** (c) …". The uniform text
  requires unconscionability *plus* the disclosure failures. If the published reading
  is right, Nevada is materially more challenger-friendly than the other three.
  **Counsel must check this against session law.**
- **Florida's § 732.702 two-witness requirement** applies to waivers of elective
  share, homestead, intestate and pretermitted share, exempt property and family
  allowance. § 61.079 itself requires no witnesses — so a Florida prenup can be
  perfectly valid for divorce and **still fail to waive death-time spousal rights**.
- **Florida disclosure is inverted between prenup and postnup**: § 732.702(2)
  requires **no** disclosure for an agreement executed *before* marriage, and **fair
  disclosure** for one executed *after*.
- **Arizona is the only one of the four requiring independent consideration** for a
  cohabitation agreement — *Cook v. Cook*, 142 Ariz. 573 (1984), which expressly left
  open whether homemaking alone suffices.

---

## 7. What software can enforce, and what it cannot

**Enforceable deterministically — build these as hard gates, not warnings:**

- California's two seven-day clocks, with the signing action blocked server-side.
  Needs a durable "final agreement presented" event, and a rule for when an edit
  resets the clock. § 1615(c)(2)(B) excludes "nonsubstantive amendments that do not
  change the terms" — default to resetting and require an override.
- California § 1612(c) counsel interlock on any spousal-support provision.
- Arizona postnup date routing at 12 September 2026.
- Florida two-witness requirement, triggered by whether the document contains a
  death-rights waiver — a content trigger, so drivable from the clause selections.
- Florida POA superpower initialing, per enumerated power.
- Child support and custody clause blocks in all four states.
- Disclosure schedules as required fields, and the disclosure waiver as a **separate
  signed instrument** rather than a recital, since all four require it in writing.
- California § 1615(c)(3) unrepresented-party packet: written explanation before
  signing plus a signed receipt, with an ordering constraint.
- Per-state, per-document execution instructions driven from the rule table.

**Not enforceable — do not pretend otherwise:**

Unconscionability, in every state, expressly a question of law for the court.
California's "unconscionable at the time of enforcement" test, which is evaluated
years later on facts that do not exist at signing. Whether disclosure was actually
fair and full, as opposed to present. Voluntariness, duress, overreaching. Florida's
*Casto* "unfair or unreasonable provision" prong. Whether an Arizona cohabitation
agreement's consideration is genuinely independent.

---

## 8. What counsel must decide, in priority order

1. **The standard for excluding a state.** The current list is not built on a stated
   test, which is why Texas is out and Florida is in. Get the test, then apply it to
   all 51.
2. **Does NRS 240A.030(3)(k) take an online product outside Nevada's registration
   scheme?** Highest-leverage single question here.
3. **Does California's LDA scheme reach an out-of-state online-only provider?**
   Not found in statute.
4. **Does Arizona's ACJA 7-208 entity certification reach an out-of-state website?**
5. **Texas** — is § 81.101(c) satisfied by our disclaimer placement, and does ch. 83
   only exclude deeds?
6. **Statutory-form status per state per document** — mandatory, safe harbour, or
   sample. The § 4401 provenance problem needs resolving before shipping that form.
7. **§ 6.2.2 clause versus instrument**, now with the CA § 1502(b) overlap and the
   Florida preneed-filing point in front of them.
8. **Nevada NRS 123A.080 disjunctive reading.**
9. **Electronic wills** — three of four launch states permit them, each with a
   qualified-custodian regime. Product decision follows the legal one.

---

## 9. Known gaps in this dossier

- Arizona amendment and effective dates for §§ 14-5501, 36-3221, 36-3224, 36-3261,
  36-3262, 14-2503/2504/2505/2518, 14-10402/10407, 14-10408, 25-211 — azleg.gov is
  JavaScript-gated and blocked every retrieval.
- A.R.S. § 12-2294 read only via a secondary reproduction.
- NRS 162A.860 exact wording read only via nevada.public.law; leg.state.nv.us
  truncated and Justia returned 403.
- Cal. Prob. Code § 4401 full form text read only via FindLaw; the state's own source
  is incomplete by its own admission.
- Arizona § 14-2505(B) states the witness prohibition but no consequence.
- Applicability of Arizona HB 2861 to pre-12-September-2026 agreements.
- New York's 2025 Electronic Wills Act — secondary source only, primary not verified.
- Reported Minnesota e-will enactment — **unverified and probably wrong**; Minn.
  Stat. § 524.2-502 contains no electronic-will reference.
