"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientEnv } from "@/lib/env";
import { DISCLAIMER_VERSION } from "@/lib/legal";
import { getMatter, getAnswers } from "@/lib/interview/data";
import { getStateRuleset, isStateAvailable } from "./state-rules.server";
import { assembleWill } from "./will";
import { renderDocx } from "./docx";
import { convertDocxToPdf } from "./pdf";
import { uploadDocument } from "./storage";
import { sendDocumentsReadyEmail } from "./email";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Generate the Will document for a matter: assemble (data-driven) → DOCX (+PDF
 * best-effort) → private storage → documents row → audit → email. Idempotent:
 * regenerating replaces prior Will files/rows for the matter.
 */
export async function generateDocumentsAction(
  matterId: string,
  acknowledged: boolean,
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Affirmative self-help disclaimer acknowledgment is REQUIRED before
  // generation (build plan §8). No ack → no documents.
  if (!acknowledged) {
    return {
      error: "Please acknowledge the self-help disclaimer to continue.",
    };
  }

  const matter = await getMatter(matterId);
  if (!matter) redirect("/dashboard");

  if (!matter.state) {
    return { error: "Please choose your state before generating documents." };
  }
  if (!(await isStateAvailable(matter.state))) {
    return {
      error:
        "Your state isn't available yet. We'll email you when it opens.",
    };
  }

  const [answers, ruleset] = await Promise.all([
    getAnswers(matterId),
    getStateRuleset(matter.state, "will"),
  ]);

  const assembled = assembleWill({ answers, ruleset });
  const docx = await renderDocx(assembled);
  const pdf = await convertDocxToPdf(docx);

  const admin = createAdminClient();

  // Log the affirmative disclaimer acknowledgment for this generation (§8).
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await admin.from("disclaimer_acknowledgments").insert({
    user_id: user.id,
    matter_id: matterId,
    disclaimer_version: DISCLAIMER_VERSION,
    context: "generation",
    ip,
  });

  // Latest template version for this kind (records provenance).
  const { data: tv } = await admin
    .from("template_versions")
    .select("id, version")
    .eq("kind", "will")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const templateRow = tv as { id: string; version: number } | null;
  const version = templateRow?.version ?? 1;

  const base = `${user.id}/${matterId}/will-v${version}`;
  try {
    await uploadDocument(`${base}.docx`, docx, DOCX_MIME);
    if (pdf) await uploadDocument(`${base}.pdf`, pdf, "application/pdf");
  } catch (err) {
    console.error("Document upload failed:", err);
    return { error: "We couldn't save your documents. Please try again." };
  }

  // Replace any prior Will document for this matter (idempotent regeneration).
  await admin.from("documents").delete().eq("matter_id", matterId).eq("kind", "will");
  await admin.from("documents").insert({
    matter_id: matterId,
    kind: "will",
    version,
    template_version_id: templateRow?.id ?? null,
    storage_path: `${base}.docx`,
    status: "generated",
    generated_at: new Date().toISOString(),
  });

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "document_generated",
    entity: "matter",
    entity_id: matterId,
    metadata: { kind: "will", state: matter.state, pdf: Boolean(pdf) },
  });
  await admin.from("matters").update({ status: "ready_to_sign" }).eq("id", matterId);

  if (user.email) {
    await sendDocumentsReadyEmail(user.email, {
      siteUrl: clientEnv.NEXT_PUBLIC_SITE_URL,
    });
  }

  redirect(`/interview/${matterId}/documents`);
}
