/**
 * Self-proving affidavits DRAFTED FROM THE RULE — for states that prescribe no form.
 *
 * [ATTORNEY REVIEW REQUIRED] Every word below was written by a non-lawyer. None
 * of it is reproduced from a statute, because in these states there is no
 * statutory form to reproduce. The point of this file is NOT to be right; it is
 * to give counsel a document to redline instead of a blank page.
 *
 * HOW THIS DIFFERS FROM `generated/self-proving-forms.ts`
 * ------------------------------------------------------
 * That file is machine-generated verbatim from a captured statute, and a test
 * fails the build if a single word drifts. Nothing of the sort is possible here:
 * there is no source text to match against. So the safety net is different in
 * kind — for each state we record the ELEMENTS its statute says the affidavit
 * must establish, with the subsection they come from, and a test asserts the
 * drafted text covers every one of them (`drafted-forms.test.ts`). That proves
 * coverage, NOT sufficiency. Only counsel can judge sufficiency.
 *
 * TWO FAMILIES
 * ------------
 * 1. ENUMERATED-ELEMENT states (IL, VT) — the statute lists exactly what must be
 *    established. Drafting is close to mechanical: track the list.
 * 2. TESTIFY-STANDARD states (CT, NY, WA, WV, and in substance OR and CA) — the
 *    statute says the witnesses may swear to "such facts as they would be
 *    required to testify to in court to prove such will". That defines the
 *    content by reference to the state's execution formalities rather than
 *    listing it, so the draft tracks the elements of due execution and, where the
 *    statute names extra facts (NY: competence and absence of restraint), those.
 *
 * DELIBERATELY ABSENT: MD and OH. Both are handled in
 * `self-proving-affidavit.ts` as open questions rather than drafts, because in
 * neither is there a paper-will self-proving mechanism to draft toward. Drafting
 * an affidavit for them would invent a procedure the legislature did not create.
 */

/** One thing the statute says the affidavit has to establish. */
export type DraftedRequirement = {
  /** Subsection this element is taken from, for the reviewer's cross-check. */
  source: string;
  /** The element, in plain terms. */
  element: string;
  /**
   * Distinctive words that must appear in the drafted text for this element to
   * count as covered. Checked by the coverage test — keep these specific enough
   * to be meaningful and loose enough to survive a reviewer's rewording.
   */
  mustAppear: string[];
};

export type DraftedForm = {
  citation: string;
  sourceUrl: string;
  /** Date the statute was last read. */
  checkedAt: string;
  /** Who swears the affidavit under this state's statute. */
  affiants: "witnesses" | "testator_and_witnesses";
  /** Whether the statute requires it be sworn before an officer. */
  requiresNotary: boolean;
  requirements: DraftedRequirement[];
  /** The drafted affidavit body. */
  paragraphs: string[];
  /** Statutory limits counsel must weigh before approving. */
  caveats: string[];
  /** What counsel specifically has to decide for this state. */
  counselQuestions: string[];
};

/**
 * Shared opening for a witnesses' affidavit. The statutes in the testify-standard
 * family all contemplate the witnesses swearing before an officer authorized to
 * administer oaths, so the venue block is common; the substance differs per state.
 */
const VENUE = "STATE OF ____________  )\n                     )  ss.\nCOUNTY OF ____________  )";

export const DRAFTED_FORMS: Record<string, DraftedForm> = {
  IL: {
    citation: "755 ILCS 5/6-4",
    sourceUrl:
      "https://www.ilga.gov/legislation/ILCS/details?MajorTopic=&Chapter=&ActName=Probate%20Act%20of%201975.&ActID=2104&ChapterID=60&ChapAct=755+ILCS+5%2F&SeqStart=8200000&SeqEnd=10400000",
    checkedAt: "2026-08-05",
    affiants: "witnesses",
    requiresNotary: true,
    // Illinois is the cleanest of the eight: 6-4(a) enumerates the three
    // statements, and 6-4(b)(3) expressly blesses an affidavit "signed by the
    // witness at or after the time of attestation and which forms part of the
    // will or is attached to the will". So the instrument itself is authorised —
    // only the wording is left open.
    requirements: [
      {
        source: "755 ILCS 5/6-4(a)(1)",
        element:
          "The witness was present and saw the testator, or another at the testator's direction and in the testator's presence, sign the will — or the testator acknowledged the will to the witness as the testator's act.",
        mustAppear: ["present and saw", "acknowledged"],
      },
      {
        source: "755 ILCS 5/6-4(a)(2)",
        element: "The will was attested by the witness in the presence of the testator.",
        mustAppear: ["attested", "in the presence of the testator"],
      },
      {
        source: "755 ILCS 5/6-4(a)(3)",
        element:
          "The witness believed the testator to be of sound mind and memory at the time of signing or acknowledging the will.",
        mustAppear: ["sound mind and memory"],
      },
    ],
    paragraphs: [
      VENUE,
      "We, the undersigned, being first duly sworn, each state on oath that we are the attesting witnesses to the foregoing instrument, which the testator, ____________, executed as the testator's last will and testament.",
      "Each of us states that he or she was present and saw the testator sign the instrument, or saw another person sign it in the testator's presence and at the testator's direction, or that the testator acknowledged the instrument to us as the testator's own act.",
      "Each of us further states that the instrument was attested by us in the presence of the testator, and that at the time the testator signed or acknowledged the instrument we believed the testator to be of sound mind and memory.",
    ],
    caveats: [
      "6-4 governs proof of a will for admission to probate; it is not framed as a 'self-proving' statute in the Uniform Probate Code sense. The practical effect is the same — the affidavit stands in for the witness's live testimony — but the label differs.",
    ],
    counselQuestions: [
      "Does this affidavit, attached to the will at execution, satisfy 6-4(b)(3) so that no attesting witness need testify at probate?",
      "Illinois requires two attesting witnesses under 755 ILCS 5/4-3 — confirm the affidavit should be sworn by both, and whether one suffices under 6-4(a).",
    ],
  },

  VT: {
    citation: "14 V.S.A. § 108",
    sourceUrl: "https://legislature.vermont.gov/statutes/section/14/003/00108",
    checkedAt: "2026-08-07",
    affiants: "testator_and_witnesses",
    requiresNotary: true,
    // Vermont is a self-proving statute that simply forgot to print a form: it
    // says a will "may be self-proved ... by the sworn acknowledgment of the
    // testator and the witnesses" and then enumerates the four circumstances.
    // Note it requires the TESTATOR to swear as well, unlike the rest of this file.
    requirements: [
      {
        source: "14 V.S.A. § 108(1)",
        element:
          "The testator signed the instrument as the testator's will, or expressly directed another to sign for the testator, in the presence of two witnesses.",
        mustAppear: ["expressly directed another", "two witnesses"],
      },
      {
        source: "14 V.S.A. § 108(2)",
        element: "The signing was the testator's free and voluntary act for the purposes expressed in the will.",
        mustAppear: ["free and voluntary act", "purposes expressed"],
      },
      {
        source: "14 V.S.A. § 108(3)",
        element:
          "Each witness signed at the request of the testator, in the testator's presence, and in the presence of the other witness.",
        mustAppear: ["at the request of the testator", "presence of the other witness"],
      },
      {
        source: "14 V.S.A. § 108(4)",
        element:
          "To the best of each witness's knowledge, at the time of signing the testator was at least 18 or emancipated by court order, of sound mind, and under no constraint or undue influence.",
        mustAppear: ["18 years", "emancipated", "sound mind", "constraint or undue influence"],
      },
    ],
    paragraphs: [
      VENUE,
      "I, ____________, the testator, and we, ____________ and ____________, the witnesses, whose names are signed to the foregoing instrument, being first duly sworn, do acknowledge to the undersigned authority as follows.",
      "The testator signed the instrument as the testator's will, or expressly directed another to sign for the testator, in the presence of two witnesses.",
      "The signing was the testator's free and voluntary act for the purposes expressed in the will.",
      "Each witness signed at the request of the testator, in the testator's presence, and in the presence of the other witness.",
      "To the best of the knowledge of each witness, at the time of the signing the testator was at least 18 years of age or emancipated by court order, was of sound mind, and was under no constraint or undue influence.",
    ],
    caveats: [
      "§ 108 requires the sworn acknowledgment of the TESTATOR as well as the witnesses. A witnesses-only affidavit of the kind used in most states would not track this statute.",
    ],
    counselQuestions: [
      "Confirm the affidavit must be sworn by the testator and both witnesses together, and that a single combined acknowledgment (rather than separate affidavits) satisfies § 108.",
    ],
  },

  NY: {
    citation: "N.Y. SCPA § 1406",
    sourceUrl: "https://www.nysenate.gov/legislation/laws/SCP/1406",
    checkedAt: "2026-08-07",
    affiants: "witnesses",
    requiresNotary: true,
    // NY is the most specific of the testify-standard family: § 1406(1) names
    // three things the affidavit must establish, so it is treated as enumerated.
    requirements: [
      {
        source: "SCPA § 1406(1)",
        element: "Facts establishing the genuineness of the will.",
        mustAppear: ["genuine"],
      },
      {
        source: "SCPA § 1406(1)",
        element: "Facts establishing the validity of the will's execution.",
        // Evidenced by the subscription facts rather than by the word
        // "execution" itself — what proves validity is who signed, before whom.
        mustAppear: ["subscribed", "in the presence of"],
      },
      {
        source: "SCPA § 1406(1)",
        element:
          "That the testator, at the time of execution, was in all respects competent to make a will and not under any restraint.",
        mustAppear: ["in all respects competent", "not under any restraint"],
      },
    ],
    paragraphs: [
      VENUE,
      "We, the undersigned, being duly sworn, each depose and say that we are the attesting witnesses to the foregoing instrument, which ____________, the testator, subscribed and declared to us to be the testator's last will and testament.",
      "The testator subscribed the instrument in our presence, or acknowledged to each of us that the signature on the instrument was the testator's own; and we thereupon subscribed our names as attesting witnesses in the presence of the testator and of each other, at the testator's request.",
      "The signatures on the instrument are genuine, being those of the testator and of the undersigned witnesses.",
      "At the time of execution the testator was, in the judgment of each of us, over the age of 18 years, in all respects competent to make a will, and not under any restraint.",
    ],
    caveats: [
      "The affidavit is accepted 'as though it had been taken before the court' UNLESS a party entitled to process objects, or the court otherwise requires the witnesses to be produced — SCPA § 1406(1)(a)-(b). It is not conclusive.",
      "New York practice commonly uses a specific attorney-supervised execution ceremony. Whether this affidavit should be adapted to that practice is a judgment for counsel.",
    ],
    counselQuestions: [
      "Confirm this satisfies § 1406(1) and matches the affidavit form New York surrogates in fact accept, which may differ from the statute's bare language.",
    ],
  },

  CT: {
    citation: "Conn. Gen. Stat. § 45a-285",
    sourceUrl: "https://www.cga.ct.gov/current/pub/chap_802b.htm",
    checkedAt: "2026-08-05",
    affiants: "witnesses",
    requiresNotary: true,
    requirements: [
      {
        source: "§ 45a-285",
        element:
          "Such facts as the attesting witnesses would be required to testify to in court to prove the will — i.e. the elements of due execution.",
        mustAppear: ["in the presence of", "subscribed"],
      },
      {
        source: "§ 45a-285 (proof of will generally)",
        element:
          "Facts showing the testator's testamentary capacity and freedom from undue influence, which a witness proving the will would be required to give.",
        mustAppear: ["sound mind", "undue influence"],
      },
    ],
    paragraphs: [
      VENUE,
      "We, the undersigned, being duly sworn, each state that we are the attesting witnesses to the foregoing instrument, and that we make this affidavit at the request of ____________, the testator, to state the facts we would be required to testify to in court to prove the will.",
      "The testator signed the instrument in our presence, or acknowledged to us that the signature on it was the testator's own, and declared the instrument to be the testator's last will and testament; and we thereupon subscribed our names as witnesses in the presence of the testator and of each other.",
      "At the time of execution the testator appeared to each of us to be of sound mind, and to be acting freely and voluntarily and under no undue influence, duress or constraint.",
    ],
    caveats: [
      "§ 45a-285 requires the affidavit be written ON the will or, if impracticable, on a paper attached to it. Placement is a compliance requirement here, not a formatting choice — the generated document must attach it, not deliver it loose.",
    ],
    counselQuestions: [
      "Confirm the content standard: 'such facts as they would be required to testify to in court to prove such will' — is anything material missing from the draft?",
      "Confirm the affidavit's placement on or attached to the will satisfies the statute as our documents assemble it.",
    ],
  },

  WA: {
    citation: "RCW § 11.20.020",
    sourceUrl: "https://app.leg.wa.gov/rcw/default.aspx?cite=11.20.020",
    checkedAt: "2026-08-05",
    affiants: "witnesses",
    requiresNotary: true,
    requirements: [
      {
        source: "RCW 11.20.020(2)",
        element:
          "Such facts as the attesting witnesses would be required to testify to in court to prove the will — the elements of due execution.",
        mustAppear: ["in the presence of", "subscribed"],
      },
      {
        source: "RCW 11.12.020 (execution) via the proof standard",
        element: "The testator's competence and freedom from undue influence at execution.",
        mustAppear: ["sound mind", "undue influence"],
      },
    ],
    paragraphs: [
      VENUE,
      "We, the undersigned, being first duly sworn, each state that we are the attesting witnesses to the foregoing instrument, and that we make this affidavit at the request of ____________, the testator, stating the facts we would be required to testify to in court to prove the will.",
      "The testator signed the instrument in our presence, or acknowledged to us that the signature on it was the testator's own, and declared it to be the testator's last will and testament; and we thereupon signed as witnesses in the presence of the testator and at the testator's request, and subscribed our names in the presence of each other.",
      "At the time of execution the testator was, in the judgment of each of us, over the age of 18 years, of sound mind, and not acting under duress, menace, fraud or undue influence.",
    ],
    caveats: [
      "RCW 11.20.020(2) allows the affidavit to be written on the will or 'affixed or logically associated with' it — language written with electronic wills in mind. For a paper will, attach it.",
    ],
    counselQuestions: [
      "Confirm the draft states everything a Washington attesting witness would be required to testify to under RCW 11.20.020(2).",
    ],
  },

  WV: {
    citation: "W. Va. Code § 41-5-15",
    sourceUrl: "https://code.wvlegislature.gov/41-5-15/",
    checkedAt: "2026-08-05",
    affiants: "witnesses",
    requiresNotary: true,
    requirements: [
      {
        source: "§ 41-5-15",
        element:
          "Such facts as would be required of the witnesses in testimony in court to establish and prove the will.",
        mustAppear: ["in the presence of", "subscribed"],
      },
      {
        source: "§ 41-5-15 (proof of due execution)",
        element: "The testator's capacity and freedom from undue influence.",
        mustAppear: ["sound mind", "undue influence"],
      },
    ],
    paragraphs: [
      VENUE,
      "We, the undersigned, being duly sworn, each state that we are the attesting witnesses to the foregoing instrument, and that we make and subscribe this affidavit at the request of ____________, the testator, stating the facts that would be required of us in testimony in court to establish and prove the will.",
      "The testator signed the instrument in our presence, or acknowledged to us that the signature on it was the testator's own, and declared it to be the testator's last will and testament; and we thereupon subscribed our names as witnesses in the presence of the testator and of each other.",
      "At the time of execution the testator appeared to each of us to be of sound mind and under no constraint or undue influence.",
    ],
    caveats: [
      "MATERIAL LIMIT — § 41-5-15 affidavits are expressly NOT admissible in any case in which there is a contest over the will. The affidavit therefore fails exactly when it would matter most, and West Virginia customers should probably be told so.",
      "The section is headed 'Proof of will while testator living', and by its terms the affidavit is made at the testator's request and preserved with the will. The heading is misleading — the body is the witness-affidavit provision — but the timing requirement is real.",
    ],
    counselQuestions: [
      "Given that the affidavit is inadmissible in a contested case, should West Virginia documents carry it at all, and what should the customer be told about its limits?",
    ],
  },

  OR: {
    citation: "ORS § 113.055",
    sourceUrl: "https://www.oregonlegislature.gov/bills_laws/ors/ors113.html",
    checkedAt: "2026-08-05",
    affiants: "witnesses",
    requiresNotary: true,
    requirements: [
      {
        source: "ORS 113.055(1)",
        element:
          "Evidence of the execution of the will, given by an attesting witness, sufficient to stand in place of the witness's presence in court.",
        mustAppear: ["in the presence of", "subscribed"],
      },
      {
        source: "ORS 113.055(1)",
        element:
          "Identification of the signatures of the testator and the witnesses on the will.",
        mustAppear: ["signature"],
      },
      {
        source: "ORS 112.225 et seq. (execution) via the proof standard",
        element: "The testator's capacity and freedom from undue influence.",
        mustAppear: ["sound mind", "undue influence"],
      },
    ],
    paragraphs: [
      VENUE,
      "We, the undersigned, being first duly sworn, each state that we are attesting witnesses to the foregoing instrument, which ____________, the testator, signed and declared to us to be the testator's will.",
      "The testator signed the instrument in our presence, or acknowledged to us that the signature on it was the testator's own; and we thereupon subscribed our names as attesting witnesses in the presence of the testator and of each other. The signature of the testator and the signatures of the witnesses on the will are those we identify as genuine.",
      "At the time of execution the testator was, in the judgment of each of us, of sound mind and not under duress, menace, fraud or undue influence.",
    ],
    caveats: [
      "ORS 113.055(1) affidavits are used on EX PARTE review of a petition for probate. Under (2) any interested person may, within 30 days, move to have the witness brought before the court, so the affidavit is not conclusive.",
      "The statute expressly permits the affidavit to be made 'at or after the time of execution', so signing it at the execution ceremony is within the statute.",
    ],
    counselQuestions: [
      "Confirm an affidavit executed at the signing ceremony (rather than at probate) is accepted under ORS 113.055(1).",
    ],
  },

  CA: {
    citation: "Cal. Prob. Code § 8220",
    sourceUrl:
      "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PROB&sectionNum=8220",
    checkedAt: "2026-08-05",
    affiants: "witnesses",
    requiresNotary: true,
    // California is the weakest fit of the eight and counsel should be told so
    // plainly. § 8220 is a rule of EVIDENCE at probate, not a self-proving
    // mechanism: it says how execution may be proved once the testator has died.
    // It does, however, expressly contemplate "an affidavit in the original will
    // that includes or incorporates the attestation clause" — which is the hook
    // this draft is built on.
    requirements: [
      {
        source: "Prob. Code § 8220(b)",
        element:
          "An affidavit in the original will that includes or incorporates the attestation clause.",
        mustAppear: ["attestation", "in the presence of"],
      },
      {
        source: "Prob. Code § 8220(a)",
        element:
          "Evidence that the will was executed in all particulars as prescribed by law.",
        mustAppear: ["executed", "subscribed"],
      },
      {
        source: "Prob. Code § 6110 (execution) via the proof standard",
        element: "The testator's capacity and freedom from undue influence.",
        mustAppear: ["sound mind", "undue influence"],
      },
    ],
    paragraphs: [
      VENUE,
      "We, the undersigned, being first duly sworn, each state that we are the subscribing witnesses to the foregoing instrument, and that this affidavit is made part of the will and incorporates its attestation clause.",
      "The testator, ____________, signed the instrument in our presence, or acknowledged to us that the signature on it was the testator's own, and declared it to be the testator's will; and each of us subscribed the instrument as a witness in the presence of the testator and in the presence of each other, the will having been executed in all particulars as prescribed by law.",
      "At the time of execution the testator was, in the judgment of each of us, over the age of 18 years, of sound mind, and not acting under duress, menace, fraud or undue influence.",
    ],
    caveats: [
      "MATERIAL — § 8220 is an evidentiary rule applied at probate, not a self-proving statute. California has no self-proving will procedure of the Uniform Probate Code kind. This draft leans on § 8220(b)'s reference to 'an affidavit in the original will that includes or incorporates the attestation clause'; whether that carries the intended effect when executed contemporaneously is a legal judgment we cannot make.",
      "§ 8220 applies only where there is no will contest ('Unless there is a contest of a will').",
      "California probate practice ordinarily proves a will using Judicial Council form DE-131 (Proof of Subscribing Witness) completed at probate. Counsel may prefer that route and no affidavit in the will at all.",
    ],
    counselQuestions: [
      "THRESHOLD QUESTION: should California documents carry a self-proving affidavit at all, or only a strong attestation clause with DE-131 handled at probate?",
      "If they should carry one, does an affidavit executed with the will and incorporating the attestation clause obtain the benefit of § 8220(b)?",
    ],
  },
};

/** State codes with a drafted (not verbatim, not placeholder) affidavit. */
export function draftedStates(): string[] {
  return Object.keys(DRAFTED_FORMS);
}
