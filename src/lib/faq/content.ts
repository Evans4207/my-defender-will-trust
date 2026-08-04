/**
 * FAQ content.
 *
 * Kept as a typed module in the repo rather than a CMS so that counsel reviews a
 * diff, and so the review state of every answer is enforced by code rather than
 * remembered by a person.
 *
 * THE RULE: an entry with `reviewStatus: "draft"` does not render in production.
 * Same discipline as `DISCLAIMER_VERSION` and the `[ATTORNEY REVIEW REQUIRED]`
 * markers — the safeguard lives in the code. Flip an entry to "approved" only when
 * counsel has signed off on that specific wording.
 *
 * WRITING RULES for anything added here:
 *   1. Educational, never advisory. Explain what a thing is and what people
 *      commonly weigh. Never "you should choose X" — that is the line between
 *      self-help document preparation and the practice of law.
 *   2. Describe the product as it actually behaves today, not as it is scoped to
 *      behave. An FAQ that describes an unbuilt feature is a false statement.
 *   3. No clause text, no legal drafting, no state-specific legal conclusions.
 *   4. When the honest answer is "we can't help with that", say so and point at
 *      /find-an-attorney.
 */

export type FaqCategory =
  | "getting-started"
  | "choosing"
  | "whats-included"
  | "your-state"
  | "accounts-and-access"
  | "signing-and-storing"
  | "membership"
  | "pricing"
  | "what-we-cannot-do";

export type FaqReviewStatus = "draft" | "approved";

export type FaqEntry = {
  id: string;
  category: FaqCategory;
  question: string;
  /** Plain paragraphs. Rendered in order; no markup. */
  answer: string[];
  reviewStatus: FaqReviewStatus;
  /** Set when the answer will need rewriting as the product changes. */
  revisitWhen?: string;
};

export const FAQ_CATEGORIES: { key: FaqCategory; label: string; blurb: string }[] = [
  {
    key: "getting-started",
    label: "Getting started",
    blurb: "What this is, who it suits, and what the process looks like.",
  },
  {
    key: "choosing",
    label: "Will or trust",
    blurb: "What each one does. We explain the difference; the choice is yours.",
  },
  {
    key: "whats-included",
    label: "What you get",
    blurb: "The documents in each package, and what is not included.",
  },
  {
    key: "your-state",
    label: "Your state",
    blurb: "Availability, and why the rules differ where you live.",
  },
  {
    key: "accounts-and-access",
    label: "Accounts and access",
    blurb: "Who can reach your documents, and what happens over time.",
  },
  {
    key: "signing-and-storing",
    label: "Signing and storing",
    blurb: "Making a document effective, and keeping it safe afterwards.",
  },
  {
    key: "membership",
    label: "Membership",
    blurb: "What the annual membership includes, and what happens if it lapses.",
  },
  {
    key: "pricing",
    label: "Pricing and refunds",
    blurb: "What things cost, partner codes, and our refund position.",
  },
  {
    key: "what-we-cannot-do",
    label: "What we cannot do",
    blurb: "The limits of a self-help service, stated plainly.",
  },
];

export const FAQ_ENTRIES: FaqEntry[] = [
  // ---------------------------------------------------------------- getting started
  {
    id: "what-is-this",
    category: "getting-started",
    question: "What is My Defender Will & Trust?",
    answer: [
      "It is self-help document preparation software. You answer a guided interview in plain English, and we assemble a Last Will and Testament or a Revocable Living Trust, along with the supporting documents that normally go with them, formatted for the rules of your state.",
      "We are not a law firm, we do not provide legal advice, and using this platform does not create an attorney-client relationship. We recommend having a licensed attorney in your state review your documents before you sign them.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "who-is-it-for",
    category: "getting-started",
    question: "Who is this suitable for?",
    answer: [
      "It is built for people with a reasonably straightforward situation who want proper documents without the cost of drafting from scratch.",
      "Some situations genuinely benefit from an attorney rather than software: business ownership, property in more than one state or country, a blended family, a beneficiary with a disability who receives means-tested benefits, a taxable estate, or an existing trust you are trying to change. If any of those describe you, we would rather point you to /find-an-attorney than sell you a document.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "how-long",
    category: "getting-started",
    question: "How long does it take?",
    answer: [
      "Most people finish the interview in twenty to forty minutes. It saves as you go, so you can stop at any point and pick up later from the same place.",
      "Gathering the details usually takes longer than answering the questions. It helps to know the full legal names of the people you want to name, and roughly how you want things divided.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "what-to-prepare",
    category: "getting-started",
    question: "What should I have ready before I start?",
    answer: [
      "Full legal names for anyone you plan to name — beneficiaries, an executor or trustee, a guardian if you have minor children, and the people you want making medical and financial decisions if you cannot.",
      "A rough sense of what you own and how you would like it divided. You do not need account numbers or valuations to complete the interview.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "do-i-need-a-lawyer",
    category: "getting-started",
    question: "Do I need a lawyer as well?",
    answer: [
      "We recommend one. Every document we produce carries that recommendation, and /find-an-attorney lists the lawyer-referral service for each state.",
      "Whether you use one is your decision. What we can tell you is that we cannot review your situation, cannot tell you whether the choices you made are right for you, and cannot represent you.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "is-it-legally-valid",
    category: "getting-started",
    question: "Will the documents be legally valid?",
    answer: [
      "A document becomes effective when it is signed correctly, not when it is generated. Each state sets its own requirements — how many witnesses, who may act as one, whether a notary is involved, where signatures go.",
      "We build your documents to the rules recorded for your state and issue step-by-step signing instructions with them. Following those instructions is the part that makes the document count, and it is the step people most often get wrong.",
    ],
    reviewStatus: "draft",
  },

  // ---------------------------------------------------------------------- choosing
  {
    id: "will-vs-trust",
    category: "choosing",
    question: "What is the difference between a will and a living trust?",
    answer: [
      "A will directs who receives what after you die, names an executor to carry that out, and lets you nominate a guardian for minor children. It takes effect on death and normally goes through probate, which is the court process for administering an estate.",
      "A revocable living trust is created while you are alive. You move assets into it and it holds them under terms you set. Assets properly held in the trust generally pass without probate. A trust package also includes a pour-over will, which catches anything you did not move into the trust.",
      "People commonly weigh the cost and duration of probate where they live, whether they own property in more than one state, whether they want their affairs to stay private, and whether they are willing to do the ongoing work of keeping assets titled in the trust. We cannot tell you which is right for you — that is exactly the kind of advice a licensed attorney gives.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "trust-more-expensive",
    category: "choosing",
    question: "Why does the trust package cost more?",
    answer: [
      "It produces more documents and more of them are interdependent: the trust itself, a pour-over will, and a funding guide, on top of the same directives and power of attorney the will package includes.",
      "A trust also carries ongoing work after signing. Assets have to be retitled into it or it does not do what people expect, which is why the package includes a funding tracker rather than leaving you to guess.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "change-my-mind",
    category: "choosing",
    question: "Can I change my mind after I start?",
    answer: [
      "You can change your answers at any point during the interview and regenerate your documents.",
      "If you have bought one package and want the other, contact us before generating rather than buying twice — we would rather sort that out than have you pay for the same thing again.",
    ],
    reviewStatus: "draft",
    revisitWhen: "Upgrade credit is decided, and once a support channel exists to contact.",
  },
  {
    id: "already-have-a-will",
    category: "choosing",
    question: "I already have a will. Can I use this to update it?",
    answer: [
      "You can create a new will here, and a properly executed new will normally revokes earlier ones. What we cannot do is amend, interpret, or advise on a document you already have.",
      "If your existing documents were drafted for a complicated situation, or you are trying to change an existing trust, that is a conversation for an attorney rather than software.",
    ],
    reviewStatus: "draft",
  },

  // ------------------------------------------------------------------ what's included
  {
    id: "will-package-contents",
    category: "whats-included",
    question: "What is in the Will Package?",
    answer: [
      "Four documents: a Last Will and Testament, a durable financial power of attorney, a healthcare directive, and a HIPAA authorisation. Step-by-step signing instructions for your state come with them.",
      "The will itself can also carry a guardian nomination for minor children, a provision for pets, an age at which a minor's share is held in trust, and authority over digital assets, depending on how you answer the interview.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "trust-package-contents",
    category: "whats-included",
    question: "What is in the Trust Package?",
    answer: [
      "A revocable living trust, a pour-over will, a durable financial power of attorney, a healthcare directive, and a HIPAA authorisation — plus signing instructions and a funding guide.",
      "The funding guide matters more than people expect. A trust only controls what has actually been transferred into it.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "what-are-directives",
    category: "whats-included",
    question: "What are the power of attorney, healthcare directive and HIPAA form for?",
    answer: [
      "They cover the situation where you are alive but cannot make or communicate decisions. A durable financial power of attorney names someone to handle money and property. A healthcare directive records your wishes about medical treatment and names someone to speak for you. A HIPAA authorisation lets named people receive your medical information.",
      "They are included in both packages rather than sold separately, because the gap they cover is the one families most often discover too late.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "file-format",
    category: "whats-included",
    question: "What format do I get my documents in?",
    answer: [
      "Word (.docx) files you can download, open and print.",
      "PDF output is not available yet. When it is, it will be offered alongside the Word version.",
    ],
    reviewStatus: "draft",
    revisitWhen: "PDF generation is connected.",
  },
  {
    id: "not-included",
    category: "whats-included",
    question: "What is not included?",
    answer: [
      "Legal advice or review, filing anything with a court, notarisation, witnesses, funding your trust for you, tax planning, and any document type beyond those listed above.",
      "We also do not store the signed original for you. That stays with you — see the signing and storing section.",
    ],
    reviewStatus: "draft",
  },

  // -------------------------------------------------------------------- your state
  {
    id: "which-states",
    category: "your-state",
    question: "Which states can I use this in?",
    answer: [
      "The current list is on the State Availability page, which reads from the live configuration rather than a static list, so it is always accurate.",
      "A state goes live only after its execution rules have been reviewed. We would rather be unavailable somewhere than produce a document that does not meet the local requirements.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "state-not-available",
    category: "your-state",
    question: "Why is my state unavailable?",
    answer: [
      "Usually because its rules need work we have not finished, or because the state regulates this kind of service in a way we have not yet met.",
      "You can join the waitlist for a closed state and we will email you when it opens.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "why-state-matters",
    category: "your-state",
    question: "Why does my state matter so much?",
    answer: [
      "Because the rules for making a document effective are set state by state: the number of witnesses, who is allowed to witness, whether a notary is required, whether a self-proving affidavit is available, and how community property is treated.",
      "Those differences change the wording and the signing steps, which is why we ask for your state early rather than at the end.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "moving-states",
    category: "your-state",
    question: "What if I move to another state?",
    answer: [
      "Documents validly executed in one state are generally recognised in another, but the practicalities differ enough that reviewing them after a move is sensible.",
      "How that applies to your documents is a question for an attorney in your new state.",
    ],
    reviewStatus: "draft",
  },

  // --------------------------------------------------------- accounts and access
  {
    id: "spouse-own-login",
    category: "accounts-and-access",
    question: "Can my spouse have their own login?",
    answer: [
      "Yes. When you choose the couples option, you start a household and invite your spouse or partner by email. They create their own account with their own login and own their own documents — their will, power of attorney, healthcare directive and HIPAA authorisation are theirs to reach, never locked inside your account.",
      "Anything genuinely joint, such as a joint trust, is shared between the two of you. Neither of you can change or delete the other's documents.",
    ],
    reviewStatus: "draft",
    revisitWhen: "Counsel to confirm the wording before it goes live.",
  },
  {
    id: "who-can-see-documents",
    category: "accounts-and-access",
    question: "Who else can see my documents?",
    answer: [
      "Only you — and, if you have a household, the spouse or partner you added. Documents are visible to the account that created them, held in private storage and served through short-lived links that only you can request. Within a household, anything genuinely joint (such as a trust) is shared with the other member; each of you still keeps your own private documents to yourselves.",
      "Beyond a household, there is currently no way to grant someone else access from inside your account, so anyone else who needs a copy needs you to give them one.",
    ],
    reviewStatus: "draft",
    revisitWhen: "Sharing ships.",
  },
  {
    id: "what-happens-when-i-die",
    category: "accounts-and-access",
    question: "What happens to my documents when I die?",
    answer: [
      "This is the most important thing on this page to get right, so we will be direct. If you have a household, your spouse or partner already has their own account and their own copy of anything joint, so they are not locked out if something happens to you. Beyond that, there is currently no mechanism for anyone else to reach your account after your death — we are building one, and it is not there yet.",
      "So do what you would do with any important document. Sign it, keep the signed original somewhere your family can find it, and tell the people you have named — your executor, your healthcare agent — that they have been named and where the paperwork is. A document nobody can find does not help anyone.",
    ],
    reviewStatus: "draft",
    revisitWhen: "The legacy contact and release-on-death process ship.",
  },
  {
    id: "do-i-keep-access",
    category: "accounts-and-access",
    question: "Do I keep access to my documents forever?",
    answer: [
      "Yes. A package is a one-time purchase and what you bought does not expire. Your generated documents stay available to download for as long as you have an account, whether or not you hold a membership.",
      "If you ever have no active purchase, you will still see your existing documents and be able to download them; you would need to buy again only to make further edits.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "download-everything",
    category: "accounts-and-access",
    question: "Can I download everything at once?",
    answer: [
      "Yes. There is an export that gives you a single ZIP containing every document you have generated, every file you have uploaded, and a manifest listing what is in it.",
      "It is deliberately not gated on a membership or an active purchase. It is your data, and the point of it is that it stays available even when other things do not.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "delete-my-account",
    category: "accounts-and-access",
    question: "Can I delete my account?",
    answer: [
      "Yes, from your account settings, behind a confirmation step. It removes your documents and your stored files.",
      "Export anything you want to keep first — deletion is not reversible, and we cannot recover documents afterwards.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "is-my-data-secure",
    category: "accounts-and-access",
    question: "How is my information protected?",
    answer: [
      "Documents and uploads live in private storage, never in a publicly reachable location, and are served only through short-lived links generated for you. Database access is restricted per-user at the database itself rather than only in the application.",
      "The Privacy Policy is the authoritative statement of what we collect, how long we keep it and who processes it.",
    ],
    reviewStatus: "draft",
  },

  // ----------------------------------------------------------- signing and storing
  {
    id: "how-do-i-sign",
    category: "signing-and-storing",
    question: "How do I sign my documents?",
    answer: [
      "Follow the execution instructions issued with your documents. They are specific to your state and cover who must be present, how many witnesses you need, who is not permitted to witness, whether a notary is required, and the order in which things are signed.",
      "Signing incorrectly is the most common way a home-prepared document fails, and it usually only comes to light when it is too late to fix.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "electronic-signature",
    category: "signing-and-storing",
    question: "Can I sign electronically?",
    answer: [
      "No. Sign on paper, by hand, with the witnesses your state requires.",
      "Electronic wills exist in a small number of states under specific conditions, and we do not currently support them anywhere.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "who-can-witness",
    category: "signing-and-storing",
    question: "Who can act as a witness?",
    answer: [
      "The requirements are state-specific and your signing instructions set them out. As a general matter, witnesses are adults who are not beneficiaries under the document.",
      "Using a beneficiary as a witness is a common and consequential mistake, so read the instructions rather than assuming.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "self-proving-affidavit",
    category: "signing-and-storing",
    question: "What is a self-proving affidavit?",
    answer: [
      "It is a notarised statement signed alongside a will, in which the witnesses confirm what they saw. Where it is available, it can spare your executor from having to track those witnesses down later.",
      "It is not offered in every jurisdiction, and where it is not, your instructions will not include one.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "where-to-keep-original",
    category: "signing-and-storing",
    question: "Where should I keep the signed original?",
    answer: [
      "Somewhere safe that the right person can actually get into. A safe deposit box that only you can open has caused real problems for real families.",
      "Tell your executor where it is. Keeping a copy in your account here is sensible as a backup, but the signed paper original is the thing that matters.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "do-i-file-it",
    category: "signing-and-storing",
    question: "Do I have to file my will anywhere?",
    answer: [
      "Generally not while you are alive. Some states offer voluntary deposit with a court; most people simply keep the original safely.",
      "We do not file anything on your behalf.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "update-later",
    category: "signing-and-storing",
    question: "How do I update my documents later?",
    answer: [
      "Change your answers and regenerate, then sign the new version following the instructions again. A regenerated document has no effect until it is signed.",
      "Marriage, divorce, a birth, a death, a move to another state, or a significant change in what you own are all worth a review.",
    ],
    reviewStatus: "draft",
  },

  // ------------------------------------------------------------------- membership
  {
    id: "what-is-membership",
    category: "membership",
    question: "What does the annual membership include?",
    answer: [
      "Unlimited updates to your documents, a secure vault for storing related paperwork, an annual estate checkup, and the trust funding tracker.",
      "It is optional. Buying a package does not require it, and not having one never affects access to documents you have already created.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "membership-lapses",
    category: "membership",
    question: "What happens if my membership lapses?",
    answer: [
      "You keep your documents and you keep being able to download them, including everything already in your vault. That does not change.",
      "What stops is uploading new files to the vault and the ongoing membership features. Locking someone out of files they uploaded themselves would not be a reasonable thing to do, so we do not.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "what-is-the-vault",
    category: "membership",
    question: "What is the vault for?",
    answer: [
      "Keeping the paperwork that sits alongside an estate plan in one place: deeds, insurance policies, account lists, a scan of your signed originals.",
      "Only you can see what is in it.",
    ],
    reviewStatus: "draft",
  },

  // --------------------------------------------------------------------- pricing
  {
    id: "what-does-it-cost",
    category: "pricing",
    question: "What does it cost?",
    answer: [
      "The Will Package and the Trust Package are each a one-time payment, priced on the home page. The annual membership is separate and optional.",
      "There is no subscription attached to a package. You buy it once.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "couples-pricing",
    category: "pricing",
    question: "Do you offer a couples price?",
    answer: [
      "Yes. Choosing “my spouse or partner and me” covers both of you — mirror wills (or a joint trust) plus matching directives for each person — and each of you still gets your own login and your own documents. The current couples pricing is shown on the plan page.",
      "You invite the second person by email; they create their own account and join your household.",
    ],
    reviewStatus: "draft",
    revisitWhen: "Counsel to confirm the wording before it goes live.",
  },
  {
    id: "access-codes",
    category: "pricing",
    question: "I have an access code from a partner. How do I use it?",
    answer: [
      "Create your account, then enter the code. Depending on the code it either unlocks a package outright or applies a discount you then check out with.",
      "Codes are issued by affiliated organisations. If yours does not work, go back to whoever gave it to you — we cannot issue replacements.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "refunds",
    category: "pricing",
    question: "What is your refund policy?",
    answer: [
      "Our refund terms are set out in the Terms of Service.",
      "Worth knowing: a full refund removes access to the documents that payment covered. If you have already signed a document you obtained here, that document is yours and a refund does not undo it — but you would no longer be able to edit or re-download it from us.",
    ],
    reviewStatus: "draft",
    revisitWhen: "The refund policy is written and approved by counsel.",
  },

  // ----------------------------------------------------------- what we cannot do
  {
    id: "not-a-law-firm",
    category: "what-we-cannot-do",
    question: "Are you a law firm?",
    answer: [
      "No. My Defender Will & Trust is not a law firm and does not provide legal advice. Using this platform does not create an attorney-client relationship, and your communications with us are not privileged.",
      "We provide self-help document preparation software. You make the decisions; we assemble the documents.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "which-should-i-choose",
    category: "what-we-cannot-do",
    question: "Can you tell me which package I should choose?",
    answer: [
      "No, and we want to be straightforward about why rather than sounding evasive. Recommending which legal instrument fits your circumstances is legal advice, and giving it would make us something we are not licensed to be.",
      "We can explain what each package produces and what people commonly weigh — see the Will or trust section. For a recommendation about your situation, /find-an-attorney lists the referral service for your state.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "review-my-answers",
    category: "what-we-cannot-do",
    question: "Can someone check my answers before I sign?",
    answer: [
      "Not from us. We cannot review your choices, tell you whether your division is sensible, or confirm that your document does what you intend.",
      "That review is exactly what a licensed attorney in your state provides, and it is why every document we produce recommends one.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "specific-situation",
    category: "what-we-cannot-do",
    question: "I have an unusual situation. Can you help?",
    answer: [
      "We can tell you how the software behaves. We cannot tell you how the law applies to you.",
      "If your situation involves a business, property abroad, a blended family, a beneficiary receiving means-tested benefits, a likely dispute, or an estate large enough for tax to matter, please speak to an attorney. Software is the wrong tool for those.",
    ],
    reviewStatus: "draft",
  },
  {
    id: "guarantee",
    category: "what-we-cannot-do",
    question: "Do you guarantee my documents will hold up?",
    answer: [
      "No, and be sceptical of anyone in this category who says otherwise. Whether a document achieves what you intended depends on your circumstances, on signing it correctly, and on facts we never see.",
      "What we do is build to the recorded requirements for your state, tell you exactly how to execute, and recommend attorney review.",
    ],
    reviewStatus: "draft",
  },
];

/**
 * Entries that may be shown, given the environment.
 *
 * Drafts render outside production so they can be read and reviewed, and never in
 * production once real customers are on the site.
 *
 * A hosted pre-launch deployment is also NODE_ENV=production, and counsel needs to
 * read the answers somewhere other than a git diff — so `FAQ_PREVIEW_DRAFTS=true`
 * opens them there. Like ALLOW_PLACEHOLDER_DISCLAIMER it fails CLOSED: only the
 * exact string "true" works, and forgetting it simply hides the drafts. Remove it
 * before launch.
 */
export function publishedEntries(
  entries: FaqEntry[] = FAQ_ENTRIES,
  env: string | undefined = process.env.NODE_ENV,
  previewDrafts: string | undefined = process.env.FAQ_PREVIEW_DRAFTS,
): FaqEntry[] {
  if (env === "production" && previewDrafts !== "true") {
    return entries.filter((e) => e.reviewStatus === "approved");
  }
  return entries;
}

/** Published entries grouped into category order, dropping empty categories. */
export function groupedEntries(
  entries: FaqEntry[] = FAQ_ENTRIES,
  env: string | undefined = process.env.NODE_ENV,
  previewDrafts: string | undefined = process.env.FAQ_PREVIEW_DRAFTS,
): { key: FaqCategory; label: string; blurb: string; entries: FaqEntry[] }[] {
  const visible = publishedEntries(entries, env, previewDrafts);
  return FAQ_CATEGORIES.map((c) => ({
    ...c,
    entries: visible.filter((e) => e.category === c.key),
  })).filter((c) => c.entries.length > 0);
}

/** How many entries still need counsel sign-off. For the pre-launch checklist. */
export function draftCount(entries: FaqEntry[] = FAQ_ENTRIES): number {
  return entries.filter((e) => e.reviewStatus === "draft").length;
}

/** True when the FAQ has anything to show. Used to hide the footer link. */
export function hasVisibleEntries(
  entries: FaqEntry[] = FAQ_ENTRIES,
  env: string | undefined = process.env.NODE_ENV,
  previewDrafts: string | undefined = process.env.FAQ_PREVIEW_DRAFTS,
): boolean {
  return publishedEntries(entries, env, previewDrafts).length > 0;
}
