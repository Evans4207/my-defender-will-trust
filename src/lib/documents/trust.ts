import type { AssembledDocument, DocSection } from "./model";
import { STATE_NAMES } from "@/lib/interview/states";
import { ATTORNEY_REVIEW_REQUIRED } from "@/lib/legal";
import { s, list, type Child, type Beneficiary } from "./answers";
import {
  perspective,
  isCouple,
  partyNames,
  jointTrustName,
  type AssembleOpts,
} from "./couples";

/*
 * ⚠️ [ATTORNEY REVIEW REQUIRED] — PLACEHOLDER language. Conditional inclusion is
 * driven by the normalized StateRuleset + answers (data-driven). A couples
 * (joint) trust names both spouses/partners as co-grantors and co-trustees.
 */

function trustName(signer: string): string {
  return `The ${signer} Revocable Living Trust`;
}

function ordinalWitnessWord(n: number): string {
  return n === 2 ? "two (2)" : `${n}`;
}

export function assembleTrust(opts: AssembleOpts): AssembledDocument {
  const { answers, ruleset } = opts;
  const about = answers.about ?? {};
  const fid = answers.fiduciaries ?? {};
  const dist = answers.distributions ?? {};
  const assets = answers.assets ?? {};
  const special = answers.special ?? {};

  const couple = isCouple(opts);
  const { primary, spouse } = partyNames(answers);

  // Grantor(s): "we"/"Grantors" for a joint trust, "I"/"Grantor" for one person.
  const signerName = couple ? `${primary} and ${spouse}` : s(about.fullName) || "[Grantor]";
  const stateName = STATE_NAMES[ruleset.state] ?? ruleset.state;
  const name = couple ? jointTrustName(answers) : trustName(signerName);
  const trustee = couple
    ? `${primary} and ${spouse}`
    : s(fid.trusteeName) || signerName;
  const successor = s(fid.successorTrusteeName);
  const successorAlt = s(fid.successorTrusteeAlt);
  const beneficiaries = list<Beneficiary>(dist.beneficiaries);
  const realEstate = list<{ description?: unknown }>(assets.realEstate);
  const accounts = list<{ institution?: unknown }>(assets.accounts);

  // Pronoun helpers so one code path serves both single and joint trusts.
  const grantorWord = couple ? "Grantors" : "Grantor";
  const grantorPoss = couple ? "Grantors'" : "Grantor's";

  const sections: DocSection[] = [];

  sections.push({
    heading: "Notice",
    paragraphs: [
      `${ATTORNEY_REVIEW_REQUIRED} This is a self-help draft. Not legal advice. We recommend a licensed attorney in ${stateName} review this trust before signing.`,
    ],
  });

  sections.push({
    heading: "Article I — Establishment of Trust",
    paragraphs: [
      couple
        ? `We, ${primary} and ${spouse}, residents of ${stateName} (the "Grantors"), establish ${name} (the "Trust"). This Trust is governed by the laws of ${stateName}.`
        : `I, ${signerName}, a resident of ${stateName} (the "Grantor"), establish ${name} (the "Trust"). This Trust is governed by the laws of ${stateName}.`,
      couple
        ? "This Trust is revocable: either Grantor may amend or revoke it as provided herein during the Grantors' joint lives while competent."
        : "This Trust is revocable: the Grantor may amend or revoke it at any time during the Grantor's lifetime while competent.",
    ],
  });

  sections.push({
    heading: "Article II — Trustees",
    paragraphs: [
      couple
        ? `The initial Co-Trustees are ${primary} and ${spouse}.`
        : `The initial Trustee is ${trustee}.`,
      successor
        ? `Upon the ${couple ? "Co-Trustees'" : "initial Trustee's"} death, resignation, or incapacity, ${successor} shall serve as successor Trustee${successorAlt ? `, and if unable, ${successorAlt}` : ""}.`
        : `${ATTORNEY_REVIEW_REQUIRED} A successor Trustee should be named.`,
    ],
  });

  // Funding (data-driven from listed assets).
  const fundingParas = [`The ${grantorWord} transfer the following property to the Trust:`];
  for (const re of realEstate) {
    const d = s(re.description);
    if (d) fundingParas.push(`• Real property: ${d}`);
  }
  for (const ac of accounts) {
    const i = s(ac.institution);
    if (i) fundingParas.push(`• Account at ${i}`);
  }
  if (fundingParas.length === 1) {
    fundingParas.push(`${ATTORNEY_REVIEW_REQUIRED} No assets listed — the Trust must be funded to be effective. See your funding guide.`);
  }
  sections.push({ heading: "Article III — Funding", paragraphs: fundingParas });

  sections.push({
    heading: `Article IV — Administration During the ${grantorPoss} Life`,
    paragraphs: [
      couple
        ? "During the Grantors' joint lives and competence, the Co-Trustees shall manage the trust property for the Grantors' benefit and distribute income and principal as the Grantors direct."
        : "During the Grantor's life and competence, the Trustee shall manage the trust property for the Grantor's benefit and distribute income and principal as the Grantor directs.",
    ],
  });

  // Distribution on death.
  const deathParas: string[] = couple
    ? [
        "Upon the death of the first Grantor, the trust property shall continue to be held for the benefit of the surviving Grantor.",
        "Upon the death of the surviving Grantor, after payment of expenses, the Trustee shall distribute the remaining trust property as follows:",
      ]
    : [
        "Upon the Grantor's death, after payment of expenses, the Trustee shall distribute the remaining trust property as follows:",
      ];
  if (beneficiaries.length) {
    for (const b of beneficiaries) {
      deathParas.push(`• ${s(String(b.percent))}% to ${s(b.name)}.`);
    }
  } else {
    deathParas.push(`${ATTORNEY_REVIEW_REQUIRED} No beneficiaries specified.`);
  }
  const predeceasesWord = couple ? "the surviving Grantor" : "the Grantor";
  if (dist.distributionType === "per_stirpes") {
    deathParas.push(`If a beneficiary predeceases ${predeceasesWord}, that share passes to their descendants, per stirpes.`);
  } else if (dist.distributionType === "per_capita") {
    deathParas.push(`If a beneficiary predeceases ${predeceasesWord}, that share is divided among the surviving beneficiaries, per capita.`);
  }
  const minorAge = s(special.minorTrustAge);
  if (minorAge) {
    deathParas.push(`Property passing to a beneficiary under age ${minorAge} shall be held in trust until that age.`);
  }
  sections.push({ heading: "Article V — Distribution on Death", paragraphs: deathParas });

  if (ruleset.communityProperty) {
    sections.push({
      heading: "Article VI — Community Property",
      paragraphs: [
        `${stateName} is a community property state. Property transferred to this Trust retains its community or separate character. ${ATTORNEY_REVIEW_REQUIRED}`,
      ],
    });
  }

  sections.push({
    heading: "Pour-Over Coordination",
    paragraphs: [
      couple
        ? `Any property not titled in the Trust at a Grantor's death is directed to this Trust through that Grantor's Pour-Over Will.`
        : `Any property not titled in the Trust at the Grantor's death is directed to this Trust through the Grantor's Pour-Over Will.`,
    ],
  });

  const signatureLines = couple
    ? [`Grantor: ${primary}`, `Grantor: ${spouse}`, "Date", "Notary Public"]
    : [`Grantor: ${signerName}`, `Trustee: ${trustee}`, "Date", "Notary Public"];

  return {
    kind: "trust",
    title: name,
    state: ruleset.state,
    signerName,
    sections,
    signatureLines,
    attorneyReviewRequired: true,
  };
}

export function assemblePouroverWill(opts: AssembleOpts): AssembledDocument {
  const { answers, ruleset } = opts;
  const family = answers.family ?? {};
  const fid = answers.fiduciaries ?? {};

  const couple = isCouple(opts);
  const { self: signerName, other: spouseName } = perspective(answers, opts.signer ?? "primary");
  const stateName = STATE_NAMES[ruleset.state] ?? ruleset.state;
  // A couple's pour-over wills both feed the one joint trust.
  const name = couple ? jointTrustName(answers) : trustName(signerName);
  const children = list<Child>(family.children);
  const minors = children.filter((c) => c.isMinor === true);
  const nWit = ordinalWitnessWord(ruleset.witnessesRequired);
  const execName = couple ? spouseName : s(fid.executorName) || "[Executor]";
  const execAlt = couple ? s(fid.executorAlt) || s(fid.executorName) : s(fid.executorAlt);

  const sections: DocSection[] = [
    {
      heading: "Notice",
      paragraphs: [`${ATTORNEY_REVIEW_REQUIRED} Self-help draft — not legal advice.`],
    },
    {
      heading: "Article I — Declaration",
      paragraphs: [
        `I, ${signerName}, a resident of ${stateName}, declare this to be my Pour-Over Will and revoke all prior wills.`,
      ],
    },
    {
      heading: "Article II — Pour-Over to Trust",
      paragraphs: [
        `I give my entire residuary estate to the then-acting trustee of ${name}, to be administered under that trust's terms. If that trust is not in effect, this gift shall be administered as a testamentary trust on the same terms.`,
      ],
    },
    {
      heading: "Article III — Executor",
      paragraphs: [
        couple
          ? `I appoint my spouse, ${execName}, as Executor${execAlt ? `, and ${execAlt} as alternate` : ""}.`
          : `I appoint ${execName} as Executor${execAlt ? `, and ${execAlt} as alternate` : ""}.`,
      ],
    },
  ];

  if (minors.length && s(fid.guardianName)) {
    sections.push({
      heading: "Article IV — Guardian for Minor Children",
      paragraphs: [
        `I appoint ${s(fid.guardianName)} as guardian of my minor children${s(fid.guardianAlt) ? `, and ${s(fid.guardianAlt)} as alternate` : ""}.`,
      ],
    });
  }

  sections.push({
    heading: "Attestation",
    paragraphs: [
      ruleset.signatureAtEndRequired
        ? `I sign this Will at the end in the presence of ${nWit} witnesses.`
        : `I sign this Will in the presence of ${nWit} witnesses.`,
    ],
  });

  const signatureLines = [`Testator: ${signerName}`, "Date"];
  for (let i = 1; i <= ruleset.witnessesRequired; i++) {
    signatureLines.push(`Witness ${i}`);
  }

  return {
    kind: "pourover",
    title: `Pour-Over Will of ${signerName}`,
    state: ruleset.state,
    signerName,
    sections,
    signatureLines,
    attorneyReviewRequired: true,
  };
}
