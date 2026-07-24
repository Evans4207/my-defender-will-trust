"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientEnv } from "@/lib/env";
import { DISCLAIMER_VERSION } from "@/lib/legal";
import { getMatter, getAnswers } from "@/lib/interview/data";
import { getStateRuleset, isStateAvailable } from "./state-rules.server";
import { documentSpecsFor } from "./package";
import { assembleDocument } from "./assemble";
import { renderDocx } from "./docx";
import { convertDocxToPdf } from "./pdf";
import { uploadDocument } from "./storage";
import { sendDocumentsReadyEmail } from "./email";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Generate the full document package for a matter (build plan §3.2):
 *   will  → will + POA + healthcare + HIPAA
 *   trust → trust + pour-over will + POA + healthcare + HIPAA
 * Data-driven assembly → DOCX (+PDF best-effort) → private storage → documents
 * rows. Idempotent: regenerating replaces the matter's prior documents.
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

  if (!acknowledged) {
    return { error: "Please acknowledge the self-help disclaimer to continue." };
  }

  const matter = await getMatter(matterId);
  if (!matter) redirect("/dashboard");

  if (!matter.state) {
    return { error: "Please choose your state before generating documents." };
  }
  if (!(await isStateAvailable(matter.state))) {
    return { error: "Your state isn't available yet. We'll email you when it opens." };
  }

  const [answers, ruleset] = await Promise.all([
    getAnswers(matterId),
    getStateRuleset(matter.state, matter.doc_type),
  ]);

  const admin = createAdminClient();

  // Log the affirmative disclaimer acknowledgment (§8).
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await admin.from("disclaimer_acknowledgments").insert({
    user_id: user.id,
    matter_id: matterId,
    disclaimer_version: DISCLAIMER_VERSION,
    context: "generation",
    ip,
  });

  // Template versions per kind (provenance).
  const { data: tvRows } = await admin
    .from("template_versions")
    .select("id, kind, version")
    .order("version", { ascending: false });
  const templateByKind = new Map<string, { id: string; version: number }>();
  for (const r of (tvRows as { id: string; kind: string; version: number }[] | null) ?? []) {
    if (!templateByKind.has(r.kind)) templateByKind.set(r.kind, { id: r.id, version: r.version });
  }

  // Individual → one document set; couples → a set per spouse (mirror wills /
  // reciprocal directives) plus a joint trust. Party comes from the interview.
  const party = answers.about?.party === "couples" ? "couples" : "individual";
  const specs = documentSpecsFor(matter.doc_type, party);
  const documentRows: Record<string, unknown>[] = [];

  try {
    for (const spec of specs) {
      const assembled = assembleDocument(spec, { answers, ruleset, party });
      const docx = await renderDocx(assembled);
      const pdf = await convertDocxToPdf(docx);

      const tpl = templateByKind.get(spec.kind);
      const version = tpl?.version ?? 1;
      // For couples, tag the path by signer so each spouse's set is distinct
      // (two "will" documents for one matter would otherwise collide).
      const tag = party === "couples" ? `-${spec.signer}` : "";
      const base = `${user.id}/${matterId}/${spec.kind}${tag}-v${version}`;

      await uploadDocument(`${base}.docx`, docx, DOCX_MIME);
      if (pdf) await uploadDocument(`${base}.pdf`, pdf, "application/pdf");

      documentRows.push({
        matter_id: matterId,
        kind: spec.kind,
        version,
        template_version_id: tpl?.id ?? null,
        storage_path: `${base}.docx`,
        status: "generated",
        generated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Document generation failed:", err);
    return { error: "We couldn't generate your documents. Please try again." };
  }

  // Replace the matter's prior documents (idempotent regeneration).
  await admin.from("documents").delete().eq("matter_id", matterId);
  await admin.from("documents").insert(documentRows);

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "documents_generated",
    entity: "matter",
    entity_id: matterId,
    metadata: {
      kinds: specs.map((sp) => sp.kind),
      party,
      state: matter.state,
      doc_type: matter.doc_type,
    },
  });
  await admin.from("matters").update({ status: "ready_to_sign" }).eq("id", matterId);

  if (user.email) {
    await sendDocumentsReadyEmail(user.email, {
      siteUrl: clientEnv.NEXT_PUBLIC_SITE_URL,
    });
  }

  redirect(`/interview/${matterId}/documents`);
}
