import { createClient } from "@/lib/supabase/server";
import { normalizeStateRules, type StateRuleset, type StateRuleRow } from "./state-rules";

/**
 * Load and normalize the rules for a state + document type. Includes rules that
 * apply to both (doc_type null) plus the type-specific rules. Public-readable
 * (RLS allows anon/authenticated select on state_rules).
 */
export async function getStateRuleset(
  state: string,
  docType: "will" | "trust",
): Promise<StateRuleset> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("state_rules")
    .select("rule_key, rule_value, citation, needs_review, doc_type")
    .eq("state_code", state)
    .or(`doc_type.is.null,doc_type.eq.${docType}`);

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
