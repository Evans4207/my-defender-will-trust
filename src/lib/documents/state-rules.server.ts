import { createClient } from "@/lib/supabase/server";
import {
  normalizeStateRules,
  type Instrument,
  type StateRuleset,
  type StateRuleRow,
} from "./state-rules";

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
  const { data } = await supabase
    .from("state_rules")
    .select("rule_key, rule_value, citation, needs_review, instrument")
    .eq("state_code", state)
    .or(`instrument.is.null,instrument.eq.${instrument}`);

  return normalizeStateRules(state, (data as StateRuleRow[] | null) ?? []);
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
