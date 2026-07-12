"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEntitlement } from "@/lib/entitlements.server";
import { isStateAvailable } from "@/lib/documents/state-rules.server";
import { isStepKey, nextStepKey, type StepKey } from "./steps";
import { validateStep } from "./schema";

type EventType = "interview_started" | "step_viewed" | "step_completed";

/** Fire-and-forget funnel event (best effort; never blocks the user). */
export async function logInterviewEvent(
  matterId: string,
  eventType: EventType,
  stepKey?: string,
): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("interview_events").insert({
      matter_id: matterId,
      user_id: user?.id ?? null,
      step_key: stepKey ?? null,
      event_type: eventType,
    });
  } catch (err) {
    console.error("interview_events insert failed:", err);
  }
}

/**
 * Start (or resume) a Will matter for the given package. Verifies entitlement,
 * reuses an in-progress matter if one exists, then routes into the interview.
 */
export async function startMatterAction(formData: FormData): Promise<void> {
  const docType = String(formData.get("doc_type"));
  if (docType !== "will" && docType !== "trust") {
    throw new Error("Invalid document type");
  }

  const entitlement = await getEntitlement();
  if (!entitlement.packages.includes(docType)) {
    redirect("/gate");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Reuse an existing matter for this doc type if present.
  const { data: existing } = await supabase
    .from("matters")
    .select("id, current_step")
    .eq("doc_type", docType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const existingRow = existing as { id: string; current_step: string | null } | null;
  if (existingRow) {
    const step =
      existingRow.current_step && isStepKey(existingRow.current_step)
        ? existingRow.current_step
        : "state";
    redirect(`/interview/${existingRow.id}/${step}`);
  }

  const { data: created, error } = await supabase
    .from("matters")
    .insert({ user_id: user.id, doc_type: docType, status: "in_progress", current_step: "state" })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Could not start matter");

  const matterId = (created as { id: string }).id;
  await logInterviewEvent(matterId, "interview_started");
  redirect(`/interview/${matterId}/state`);
}

/** Autosave a step draft. Lenient — no validation. Called on change (debounced). */
export async function saveDraftAction(
  matterId: string,
  stepKey: string,
  data: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  if (!isStepKey(stepKey)) return { ok: false };
  const supabase = await createClient();

  const { error } = await supabase
    .from("interview_answers")
    .upsert(
      { matter_id: matterId, step_key: stepKey, answers_jsonb: data },
      { onConflict: "matter_id,step_key" },
    );
  if (error) return { ok: false };

  await supabase.from("matters").update({ current_step: stepKey }).eq("id", matterId);
  return { ok: true };
}

/**
 * Validate + persist a step, advance the resume pointer, log completion, and
 * route to the next step (or the review→generate handoff).
 */
export async function completeStepAction(
  matterId: string,
  stepKey: string,
  data: Record<string, unknown>,
): Promise<{ error: string } | void> {
  if (!isStepKey(stepKey)) return { error: "Unknown step." };

  const result = validateStep(stepKey, data);
  if (!result.ok) return { error: result.error };

  // Excluded-state enforcement (§5.4): cannot advance past state selection in an
  // unavailable state. Defense-in-depth beyond the client-side gate.
  if (stepKey === "state") {
    const st = typeof data.state === "string" ? data.state : "";
    if (!st || !(await isStateAvailable(st))) {
      return {
        error: "This state isn't available yet. Join the waitlist to be notified.",
      };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("interview_answers")
    .upsert(
      { matter_id: matterId, step_key: stepKey, answers_jsonb: data },
      { onConflict: "matter_id,step_key" },
    );
  if (error) return { error: "Could not save. Please try again." };

  // Keep the matter's state column in sync from the state step.
  if (stepKey === "state" && typeof data.state === "string") {
    await supabase.from("matters").update({ state: data.state }).eq("id", matterId);
  }
  // Persist doc type selection.
  if (stepKey === "doctype" && (data.doc_type === "will" || data.doc_type === "trust")) {
    await supabase.from("matters").update({ doc_type: data.doc_type }).eq("id", matterId);
  }

  const next: StepKey | null = nextStepKey(stepKey);
  await supabase
    .from("matters")
    .update({ current_step: next ?? "review" })
    .eq("id", matterId);
  await logInterviewEvent(matterId, "step_completed", stepKey);

  if (next) {
    redirect(`/interview/${matterId}/${next}`);
  }
  // Completed the review step → hand off to generation (Phase 3).
  redirect(`/interview/${matterId}/generate`);
}
