import { createClient } from "@/lib/supabase/server";
import { isStepKey, type StepKey } from "./steps";

export type Matter = {
  id: string;
  user_id: string;
  doc_type: "will" | "trust";
  state: string | null;
  status: string;
  current_step: string | null;
  /** Set when this matter belongs to a household (couples). Null otherwise. */
  household_id: string | null;
};

/** Load a matter the current user owns (RLS-scoped). Null if not found. */
export async function getMatter(matterId: string): Promise<Matter | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("matters")
    .select("id, user_id, doc_type, state, status, current_step, household_id")
    .eq("id", matterId)
    .maybeSingle();
  return (data as Matter | null) ?? null;
}

/** Map of step_key -> saved answers for a matter. */
export async function getAnswers(
  matterId: string,
): Promise<Record<string, Record<string, unknown>>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("interview_answers")
    .select("step_key, answers_jsonb")
    .eq("matter_id", matterId);

  const rows =
    (data as { step_key: string; answers_jsonb: Record<string, unknown> }[] | null) ??
    [];
  const out: Record<string, Record<string, unknown>> = {};
  for (const r of rows) out[r.step_key] = r.answers_jsonb ?? {};
  return out;
}

/** Where to resume: the matter's saved current_step, else the first step. */
export function resumeStep(matter: Matter): StepKey {
  return matter.current_step && isStepKey(matter.current_step)
    ? matter.current_step
    : "state";
}
