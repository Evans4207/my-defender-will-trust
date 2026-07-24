import type { AssembledDocument } from "./model";
import { STATE_NAMES } from "@/lib/interview/states";
import { ATTORNEY_REVIEW_REQUIRED } from "@/lib/legal";
import { s } from "./answers";
import { perspective, isCouple, type AssembleOpts } from "./couples";

/*
 * ⚠️ [ATTORNEY REVIEW REQUIRED] — PLACEHOLDER ancillary documents. Where a state
 * provides a statutory form, that form must be used verbatim (build plan §5.7);
 * statutory-form text is populated per state during rollout (Phase 6). Until
 * then these are general placeholder forms flagged for review.
 *
 * Couples are reciprocal: each spouse/partner names the OTHER as their primary
 * agent, with the person named in the interview serving as the shared successor.
 */

function statutoryNote(kind: string, stateName: string): string {
  return `${ATTORNEY_REVIEW_REQUIRED} Where ${stateName} provides a statutory ${kind} form, that form is used verbatim. This draft is a general placeholder pending state-specific statutory text.`;
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
      { heading: "Notice", paragraphs: [statutoryNote("power of attorney", stateName)] },
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
    signatureLines: [`Principal: ${signerName}`, "Date", "Notary Public"],
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
      { heading: "Notice", paragraphs: [statutoryNote("advance healthcare directive", stateName)] },
      { heading: "Healthcare Agent", paragraphs: agentParas },
      {
        heading: "Living Will",
        paragraphs: [
          "This directive expresses my wishes concerning life-sustaining treatment, to be honored to the extent permitted by law.",
        ],
      },
    ],
    signatureLines: [`Principal: ${signerName}`, "Date", "Witness 1", "Witness 2"],
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
    signatureLines: [`Individual: ${signerName}`, "Date"],
  };
}
