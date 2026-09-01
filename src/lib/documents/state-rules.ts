/**
 * Typed view of the data-driven state_rules for a jurisdiction. The document
 * assembler consumes ONLY this normalized shape — it never branches on a state
 * code directly (Instructions #5: keep the rules layer data-driven).
 */
export type StateRuleset = {
  state: string;
  /**
   * The instrument these rules were loaded for. A ruleset is only ever valid for
   * the instrument it was fetched for — handing a will ruleset to the POA
   * assembler is how a document ends up asserting another instrument's law.
   */
  instrument: Instrument;
  /**
   * Whether `state_rules` actually holds instrument-scoped rows for this
   * (state, instrument). False means nothing has been researched for this
   * instrument HERE — the values below are code fallbacks, not this state's law,
   * and the execution block must fail closed rather than print them.
   *
   * This is per state AND per instrument on purpose. Research arrives one
   * jurisdiction at a time, so "is the POA rule-backed?" has no single answer:
   * it is yes in whichever states have rows and no everywhere else, and it flips
   * per state the moment counsel-approved rows land, with no code change.
   *
   * True requires the keys the block CONSUMES — both `witnesses_required` and
   * `notarization_required_for_document`, or an `execution_alternatives` row
   * that replaces them. A partially seeded instrument fails closed.
   */
  hasRecordedRules: boolean;
  /**
   * Rule keys recorded for this instrument in this state, excluding state-level
   * rows. Exposed so a caller can tell "recorded as not required" from "not
   * researched", which the defaulted booleans above cannot express.
   */
  recordedRuleKeys: string[];
  /**
   * Where a state accepts EITHER of several rituals rather than requiring all
   * parts of one. Null means the ordinary conjunction of `witnessesRequired` and
   * `notarizationRequired` applies, which is the common case.
   */
  executionAlternatives: ExecutionOption[] | null;
  witnessesRequired: number;
  witnessMinAge: number | null;
  notarizationRequired: boolean;
  selfProvingAffidavit: {
    available: boolean | "uncertain";
    requiresNotary: boolean;
  };
  communityProperty: boolean;
  signatureAtEndRequired: boolean;
  electronicWillPermitted: boolean;
  /** True if any consumed rule is flagged needs_review or is ambiguous. */
  needsReview: boolean;
  /** Citations by rule_key, for the audit trail / instructions footer. */
  citations: Record<string, string>;
};

/**
 * Which legal instrument a state_rules row governs — `public.instrument_type`.
 *
 * NOT the same thing as `public.doc_type`, which means "which package was sold"
 * (`matters.doc_type`, `subscriptions.package`, `entitlement_grants.package`,
 * and so on). Migration 0017 separated the two. Conflating them is what left a
 * trust customer's pour-over will with no will research behind it.
 */
export type Instrument =
  | "will"
  | "pourover"
  | "trust"
  | "poa"
  | "healthcare"
  | "hipaa";

/** Every label in `public.instrument_type`, in the enum's own order. */
export const INSTRUMENTS: readonly Instrument[] = [
  "will",
  "pourover",
  "trust",
  "poa",
  "healthcare",
  "hipaa",
] as const;

/**
 * The instrument whose recorded rules govern a given document.
 *
 * The only interesting line here is `pourover -> "will"`. A pour-over will is a
 * will: it is admitted to probate, it needs that state's witnesses, and it takes
 * that state's self-proving affidavit. Which package the customer bought does
 * not change its execution formalities. Before this mapping existed, a trust
 * customer's pour-over will was assembled from rules fetched for the package
 * ("trust"), of which there are none, so it silently lost its affidavit, its
 * notary line and any signature-at-the-end requirement.
 *
 * `affidavit` maps to "will" for the same reason: it is part of the will's
 * execution, not a separate instrument, and `instrument_type` has no label for it.
 */
export function ruleSourceFor(
  kind: "will" | "pourover" | "affidavit" | "trust" | "poa" | "healthcare" | "hipaa",
): Instrument {
  switch (kind) {
    case "pourover":
    case "affidavit":
    case "will":
      return "will";
    default:
      return kind;
  }
}

export type StateRuleRow = {
  rule_key: string;
  rule_value: unknown;
  citation?: string | null;
  needs_review?: boolean | null;
  /**
   * Present on rows read from the database. NULL means the row is a fact about
   * the state rather than about an instrument (community property) — it does
   * NOT mean "applies to every instrument", a meaning migration 0017 removed.
   */
  instrument?: Instrument | null;
};

/**
 * One way a state will accept an instrument as executed.
 *
 * Deliberately structural — a witness count and a notary flag, no prose. The
 * human wording is derived in `execution-block.ts`, so the seed never carries a
 * sentence about the law that could drift from the citation beside it.
 */
export type ExecutionOption = {
  witnesses: number;
  notary: boolean;
};

/**
 * Parse the `execution_alternatives` rule value.
 *
 * Shape: `{"any_of": [{"witnesses": 2, "notary": false}, {"witnesses": 0, "notary": true}]}`
 *
 * Some states accept EITHER of two rituals rather than requiring both parts of
 * one. `witnesses_required` + `notarization_required_for_document` can only
 * express a conjunction, so before this key existed a disjunction had no
 * representation at all: Cal. Prob. Code § 4402 accepts a POA signed before a
 * notary OR before two witnesses, and every way of forcing that into the two
 * older keys asserts something untrue — dropping the notary branch, inventing a
 * notary requirement, or demanding both and overstating the law.
 *
 * Where this key is present it REPLACES the two older keys for that instrument.
 * Anything malformed returns null, so a bad row falls back to the conjunction
 * path rather than silently producing an empty choice.
 */
export function parseExecutionAlternatives(
  value: unknown,
): ExecutionOption[] | null {
  const anyOf = obj(value).any_of;
  if (!Array.isArray(anyOf) || anyOf.length < 2) return null;

  const options: ExecutionOption[] = [];
  const seen = new Set<string>();
  for (const raw of anyOf) {
    const o = obj(raw);
    const notary = typeof o.notary === "boolean" ? o.notary : null;
    if (notary === null) return null;

    // Must be a whole, non-negative count. `typeof === "number"` alone let 0.5
    // through, which printed an option header — "Option 1: 0.5 witnesses" —
    // with no witness line under it, because the render loop runs to <= 0.5 and
    // never executes. An option with nothing to sign is worse than no option.
    const witnesses = o.witnesses;
    if (typeof witnesses !== "number" || !Number.isInteger(witnesses)) return null;
    if (witnesses < 0) return null;

    // An option requiring nothing at all is not an alternative, it is a bug.
    if (witnesses === 0 && !notary) return null;

    // Two identical branches are one requirement wearing a choice's clothes, and
    // would print "complete ONE of the following" over the same block twice.
    const key = `${witnesses}/${notary}`;
    if (seen.has(key)) return null;
    seen.add(key);

    options.push({ witnesses, notary });
  }
  return options;
}

/**
 * Instruments whose execution block is built by `testamentarySignatureLines`,
 * which does not consult `executionAlternatives` — and whose attestation prose
 * additionally asserts a witness count in drafted language.
 */
const TESTAMENTARY: ReadonlySet<Instrument> = new Set<Instrument>([
  "will",
  "pourover",
]);

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

/** Build a normalized ruleset from raw state_rules rows. Pure + testable. */
export function normalizeStateRules(
  state: string,
  rows: StateRuleRow[],
  instrument: Instrument = "will",
): StateRuleset {
  const byKey = new Map<string, StateRuleRow>();
  for (const r of rows) byKey.set(r.rule_key, r);

  const citations: Record<string, string> = {};
  let needsReview = false;
  for (const r of rows) {
    if (r.citation) citations[r.rule_key] = r.citation;
    if (r.needs_review) needsReview = true;
  }

  // Which rule keys are recorded FOR THIS INSTRUMENT. State-level rows
  // (instrument null — community property) come back with every query and say
  // nothing about whether this instrument has been researched here, so they are
  // excluded. Rows loaded from the database always carry `instrument`;
  // hand-built rows in tests may omit it and are read as belonging here.
  const recordedRuleKeys = [
    ...new Set(
      rows
        .filter((r) => r.instrument === undefined || r.instrument === instrument)
        .map((r) => r.rule_key),
    ),
  ];

  const get = (key: string) => obj(byKey.get(key)?.rule_value);

  const witnesses = get("witnesses_required");
  const witnessAge = get("witness_min_age");
  const notarization = get("notarization_required_for_document");
  const selfProving = get("self_proving_affidavit");
  const community = get("community_property");
  const sigEnd = get("signature_at_end_required");
  const ewill = get("electronic_will_permitted");

  const spAvailable = selfProving.available;
  if (spAvailable === "uncertain") needsReview = true;

  // `execution_alternatives` is honoured only where something reads it. The
  // testamentary block builder does not, and the will's attestation prose states
  // a witness count in drafted language that no disjunction can satisfy, so a
  // will-scoped row would be silently dropped and the conjunction printed in its
  // place. Refusing it here — loudly, via needsReview — beats half-honouring it
  // and shipping a document whose signature block and attestation disagree.
  const alternativesRow = byKey.get("execution_alternatives");
  const alternativesApply = !TESTAMENTARY.has(instrument);
  if (alternativesRow && !alternativesApply) needsReview = true;
  const executionAlternatives = alternativesApply
    ? parseExecutionAlternatives(alternativesRow?.rule_value)
    : null;

  // A malformed alternatives row must not quietly fall through to the
  // conjunction path either: the row exists precisely because the conjunction is
  // the wrong answer for this state.
  if (alternativesRow && alternativesApply && executionAlternatives === null) {
    needsReview = true;
  }

  /**
   * Whether the keys the execution block ACTUALLY CONSUMES are recorded for this
   * instrument — not merely whether some row exists.
   *
   * The distinction is the whole point. `witnessesRequired` falls back to a
   * hardcoded 2 and `notarizationRequired` to false when their rows are absent,
   * so "any row exists" let a single recorded key switch the block on and then
   * print the fallbacks as though they were the state's law. A Nevada POA with
   * only its notarization row seeded seeded printed two witness lines — under a
   * notice asserting they were Nevada's recorded requirement — when Nevada
   * requires none. That is the exact failure this module exists to prevent, so
   * the check now names the keys.
   */
  const hasRecordedRules = executionAlternatives
    ? true
    : recordedRuleKeys.includes("witnesses_required") &&
      recordedRuleKeys.includes("notarization_required_for_document");

  return {
    state,
    instrument,
    hasRecordedRules,
    recordedRuleKeys,
    executionAlternatives,
    witnessesRequired: typeof witnesses.count === "number" ? witnesses.count : 2,
    witnessMinAge: typeof witnessAge.age === "number" ? witnessAge.age : null,
    notarizationRequired: notarization.required === true,
    selfProvingAffidavit: {
      available:
        spAvailable === true || spAvailable === "uncertain"
          ? spAvailable
          : false,
      requiresNotary: selfProving.requires_notary === true,
    },
    communityProperty: community.community_property === true,
    signatureAtEndRequired: sigEnd.required === true,
    electronicWillPermitted: ewill.permitted === true,
    needsReview,
    citations,
  };
}
