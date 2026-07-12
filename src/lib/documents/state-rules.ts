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

export type StateRuleRow = {
  rule_key: string;
  rule_value: unknown;
  citation?: string | null;
  needs_review?: boolean | null;
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
