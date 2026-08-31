import type { AssembledDocument } from "./model";
import { STATE_NAMES } from "@/lib/interview/states";
import { ATTORNEY_REVIEW_REQUIRED } from "@/lib/legal";
import { s } from "./answers";
import { perspective, isCouple, type AssembleOpts } from "./couples";
import {
  ancillarySignatureLines,
  hasRecordedExecutionRules,
  recordedExecutionNotice,
  unresearchedExecutionNotice,
  unresearchedSignatureLines,
} from "./execution-block";

/*
 * ⚠️ [ATTORNEY REVIEW REQUIRED] — PLACEHOLDER ancillary documents. Where a state
 * provides a statutory form, that form must be used verbatim (build plan §5.7);
 * statutory-form text is populated per state during rollout (Phase 6). Until
 * then these are general placeholder forms flagged for review.
 *
 * Couples are reciprocal: each spouse/partner names the OTHER as their primary
 * agent, with the person named in the interview serving as the shared successor.
 */

/**
 * Notice printed at the head of each ancillary document.
 *
 * This previously read "Where [State] provides a statutory [kind] form, that
 * form is used verbatim" — a statement the document could not support. No
 * statutory form text exists for any state in this codebase, and no data records
 * which states publish one. docs/STATE_COMPLIANCE_DOSSIER.md §4 flags it: "The
 * document is making a false statement about itself." Corrected to describe what
 * the draft actually is.
 */
function statutoryNote(kind: string, stateName: string): string {
  return `${ATTORNEY_REVIEW_REQUIRED} This is a general placeholder ${kind}. It is NOT ${stateName}'s statutory form, and no statutory form text has been incorporated. Where ${stateName} publishes or prescribes a form, that form must replace this draft before use.`;
}

export function assemblePoa(opts: AssembleOpts): AssembledDocument {
  const { answers, ruleset } = opts;
  const ancillary = answers.ancillary ?? {};
  const couple = isCouple(opts);
  const { self: signerName, other: spouseName } = perspective(answers, opts.signer ?? "primary");
  const stateName = STATE_NAMES[ruleset.state] ?? ruleset.state;
  const agent = couple ? spouseName : s(ancillary.financialPoaAgent) || "[Agent]";
  const successor = couple ? s(ancillary.financialPoaAgent) : "";

  const appointment = [
    `I, ${signerName}, appoint ${agent} as my agent (attorney-in-fact) to act for me in financial matters.`,
  ];
  if (successor) {
    appointment.push(
      `If my agent is unable or unwilling to serve, I appoint ${successor} as successor agent.`,
    );
  }

  return {
    kind: "poa",
    title: `Durable Financial Power of Attorney of ${signerName}`,
    state: ruleset.state,
    signerName,
    attorneyReviewRequired: true,
    sections: [
      {
        heading: "Notice",
        paragraphs: [
          statutoryNote("power of attorney", stateName),
          hasRecordedExecutionRules(ruleset)
            ? recordedExecutionNotice("poa", stateName)
            : unresearchedExecutionNotice("poa", stateName),
        ],
      },
      { heading: "Appointment", paragraphs: appointment },
      {
        heading: "Durability",
        paragraphs: [
          "This power of attorney is durable and is not affected by my subsequent disability or incapacity.",
        ],
      },
      {
        heading: "Powers",
        paragraphs: [
          "My agent may manage my property, banking, taxes, and other financial affairs, subject to applicable law.",
        ],
      },
    ],
    // Derived where this state's POA rules are recorded; fails closed where they
    // are not — and today that is every state, because no POA rows are seeded.
    // Per docs/STATE_COMPLIANCE_DOSSIER.md §4 the requirements diverge sharply:
    // Florida needs two witnesses AND a notary, Arizona one witness AND a notary
    // plus mandatory notarial certificate text (§ 14-5501(D)(4)), California a
    // notary OR two witnesses. That last one is a disjunction the rules layer
    // cannot express at all — see docs/ANCILLARY_RULES_GAPS.md.
    signatureLines: hasRecordedExecutionRules(ruleset)
      ? ancillarySignatureLines({
          ruleset,
          roleLines: [`Principal: ${signerName}`],
        })
      : unresearchedSignatureLines([`Principal: ${signerName}`]),
  };
}

export function assembleHealthcare(opts: AssembleOpts): AssembledDocument {
  const { answers, ruleset } = opts;
  const ancillary = answers.ancillary ?? {};
  const couple = isCouple(opts);
  const { self: signerName, other: spouseName } = perspective(answers, opts.signer ?? "primary");
  const stateName = STATE_NAMES[ruleset.state] ?? ruleset.state;
  const agent = couple ? spouseName : s(ancillary.healthcareAgent) || "[Healthcare Agent]";
  const successor = couple ? s(ancillary.healthcareAgent) : "";

  const agentParas = [
    `I, ${signerName}, appoint ${agent} to make healthcare decisions for me if I am unable to make them myself.`,
  ];
  if (successor) {
    agentParas.push(
      `If ${agent} is unable or unwilling to serve, I appoint ${successor} as alternate healthcare agent.`,
    );
  }

  return {
    kind: "healthcare",
    title: `Healthcare Directive of ${signerName}`,
    state: ruleset.state,
    signerName,
    attorneyReviewRequired: true,
    sections: [
      {
        heading: "Notice",
        paragraphs: [
          statutoryNote("advance healthcare directive", stateName),
          hasRecordedExecutionRules(ruleset)
            ? recordedExecutionNotice("healthcare", stateName)
            : unresearchedExecutionNotice("healthcare", stateName),
        ],
      },
      { heading: "Healthcare Agent", paragraphs: agentParas },
      {
        heading: "Living Will",
        paragraphs: [
          "This directive expresses my wishes concerning life-sustaining treatment, to be honored to the extent permitted by law.",
        ],
      },
    ],
    // Derived where recorded, fails closed where not — today, everywhere. The
    // previous block always printed exactly two witness lines and never a notary
    // line, but Arizona requires a notary, and Cal. Prob. Code § 4675 requires a
    // patient advocate or ombudsman to witness when the patient is in a skilled
    // nursing facility, without which the directive is not effective. That last
    // condition depends on the signer's circumstances rather than the state, so
    // no witness count can capture it — see docs/ANCILLARY_RULES_GAPS.md.
    signatureLines: hasRecordedExecutionRules(ruleset)
      ? ancillarySignatureLines({
          ruleset,
          roleLines: [`Principal: ${signerName}`],
        })
      : unresearchedSignatureLines([`Principal: ${signerName}`]),
  };
}

export function assembleHipaa(opts: AssembleOpts): AssembledDocument {
  const { answers, ruleset } = opts;
  const ancillary = answers.ancillary ?? {};
  const couple = isCouple(opts);
  const { self: signerName, other: spouseName } = perspective(answers, opts.signer ?? "primary");
  const releaseTo = couple
    ? `my spouse, ${spouseName}`
    : s(ancillary.healthcareAgent) || s(ancillary.financialPoaAgent) || "my designated agents";

  return {
    kind: "hipaa",
    title: `HIPAA Authorization of ${signerName}`,
    state: ruleset.state,
    signerName,
    attorneyReviewRequired: true,
    sections: [
      {
        heading: "Authorization",
        paragraphs: [
          `${ATTORNEY_REVIEW_REQUIRED} I, ${signerName}, authorize my healthcare providers to release my protected health information to ${releaseTo} under HIPAA (45 CFR 164.508).`,
        ],
      },
      {
        heading: "Scope",
        paragraphs: [
          "This authorization applies to all medical records necessary for my agents to act on my behalf, and remains in effect until revoked in writing.",
        ],
      },
    ],
    // Deliberately NOT routed through unresearchedSignatureLines. A HIPAA
    // authorization is governed by 45 CFR 164.508, which regulates content and
    // requires the individual's signature and date — no witnesses, no notary.
    // This block asserts nothing that is not federally required, so there is no
    // false claim to fail closed on.
    //
    // Note for the state-rules work that follows: state law can still add
    // requirements this assembler does not model. Cal. Civ. Code § 56.11 requires
    // a CMIA authorization to be in 14-point type minimum, "clearly separate from
    // any other language on the same page," and signed by a signature "that
    // serves no other purpose" — a formatting and layout constraint rather than a
    // signature-block one, and out of scope here.
    signatureLines: [`Individual: ${signerName}`, "Date"],
  };
}
