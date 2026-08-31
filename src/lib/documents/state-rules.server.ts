import { createClient } from "@/lib/supabase/server";
import {
  INSTRUMENTS,
  normalizeStateRules,
  type Instrument,
  type StateRuleset,
  type StateRuleRow,
} from "./state-rules";

/** Every instrument's ruleset for one state. */
export type StateRulesets = Record<Instrument, StateRuleset>;

/**
 * Load every instrument's rules for a state in ONE query.
 *
 * A document set spans several instruments — a trust package produces a trust, a
 * pour-over will, a POA, a healthcare directive and a HIPAA authorization — and
 * each needs its own ruleset now that rules are scoped by instrument. Fetching
 * per instrument would mean five round-trips for one generation, so this fetches
 * the state once and partitions client-side.
 *
 * Each instrument's ruleset gets that instrument's rows plus the state-level rows
 * (instrument null), exactly as a filtered query would return.
 */
export async function getStateRulesets(state: string): Promise<StateRulesets> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("state_rules")
    .select("rule_key, rule_value, citation, needs_review, instrument")
    .eq("state_code", state);

  // A failed query used to become an empty row set, and an empty row set becomes
  // a ruleset of code fallbacks — 2 witnesses, no notary, no affidavit. The will
  // path does not gate on hasRecordedRules, so that silently produced a document
  // asserting formalities no database ever supplied. Refuse instead.
  if (error) {
    throw new Error(
      `Could not load state rules for ${state}: ${error.message}. Refusing to assemble documents from fallback values.`,
    );
  }

  const rows = (data as StateRuleRow[] | null) ?? [];
  const out = {} as StateRulesets;
  for (const instrument of INSTRUMENTS) {
    out[instrument] = normalizeStateRules(
      state,
      rows.filter((r) => r.instrument == null || r.instrument === instrument),
      instrument,
    );
  }
  return out;
}

/**
 * Load and normalize the rules governing one INSTRUMENT in one state. Returns
 * that instrument's rules plus the state-level rows (instrument null — facts
 * about the state, such as community property). Public-readable: RLS allows
 * anon/authenticated select on state_rules.
 *
 * Takes an instrument, not a package. Passing `matter.doc_type` here is the bug
 * migration 0017 exists to prevent: that is the package the customer bought, and
 * for a trust package it asks the database for trust rules, of which there are
 * none recorded for any state. Use `ruleSourceFor(kind)` to go from a document
 * kind to the instrument whose rules govern it — notably, a pour-over will takes
 * will rules.
 */
export async function getStateRuleset(
  state: string,
  instrument: Instrument,
): Promise<StateRuleset> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("state_rules")
    .select("rule_key, rule_value, citation, needs_review, instrument")
    .eq("state_code", state)
    .or(`instrument.is.null,instrument.eq.${instrument}`);

  // See getStateRulesets: an error must not degrade into fallback values.
  if (error) {
    throw new Error(
      `Could not load ${instrument} rules for ${state}: ${error.message}. Refusing to assemble documents from fallback values.`,
    );
  }

  return normalizeStateRules(
    state,
    (data as StateRuleRow[] | null) ?? [],
    instrument,
  );
}

/** Whether a state is currently available to generate in. */
export async function isStateAvailable(state: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("state_availability")
    .select("available")
    .eq("state_code", state)
    .maybeSingle();
  return (data as { available: boolean } | null)?.available === true;
}

/** Set of state codes currently available (available = true). */
export async function getAvailableStateCodes(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("state_availability")
    .select("state_code")
    .eq("available", true);
  return ((data as { state_code: string }[] | null) ?? []).map((r) => r.state_code);
}
