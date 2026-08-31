/**
 * Typed view of the data-driven state_rules for a jurisdiction. The document
 * assembler consumes ONLY this normalized shape — it never branches on a state
 * code directly (Instructions #5: keep the rules layer data-driven).
 */
export type StateRuleset = {
  state: string;
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

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

/** Build a normalized ruleset from raw state_rules rows. Pure + testable. */
export function normalizeStateRules(
  state: string,
  rows: StateRuleRow[],
): StateRuleset {
  const byKey = new Map<string, StateRuleRow>();
  for (const r of rows) byKey.set(r.rule_key, r);

  const citations: Record<string, string> = {};
  let needsReview = false;
  for (const r of rows) {
    if (r.citation) citations[r.rule_key] = r.citation;
    if (r.needs_review) needsReview = true;
  }

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

  return {
    state,
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
