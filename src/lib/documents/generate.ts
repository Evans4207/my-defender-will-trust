"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientEnv } from "@/lib/env";
import {
  DISCLAIMER_VERSION,
  assertDisclaimerVersionApproved,
} from "@/lib/legal";
import { COUPLES_TIER_OPEN } from "@/lib/features";
import { getMatter, getAnswers } from "@/lib/interview/data";
import { getStateRulesets, isStateAvailable } from "./state-rules.server";
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

  // Rules are loaded per INSTRUMENT, not per package. `matter.doc_type` is the
  // package the customer bought; passing it to the rules layer is what left
  // trust customers with a pour-over will built from no will research at all —
  // the query asked for trust rules, the seed has none for any state, and the
  // affidavit, the notary line and Florida's signature-at-the-end requirement
  // silently vanished.
  //
  // Every instrument's ruleset is fetched together in one query, and
  // assembleDocument hands each document the one that governs it. Instruments
  // with no rows for this state come back with hasRecordedRules false and fail
  // closed in execution-block.ts, which is currently all of them except the
  // will — per state, so a jurisdiction starts using its POA rules the moment
  // they land, with no code change.
  const [answers, rulesets] = await Promise.all([
    getAnswers(matterId),
    getStateRulesets(matter.state),
  ]);

  const admin = createAdminClient();

  // A consent record stamped with a placeholder version is not evidence of
  // anything, so refuse to write one in production.
  assertDisclaimerVersionApproved();

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
  // reciprocal directives) plus a joint trust. Party comes from the interview,
  // which is user-supplied, so the closed-tier check has to happen here rather
  // than in the UI: while COUPLES_TIER_OPEN is false a couples answer must not
  // produce a couples package. See lib/features.ts.
  const party =
    COUPLES_TIER_OPEN && answers.about?.party === "couples"
      ? "couples"
      : "individual";

  // A household couples matter routes each spouse's set to a DIFFERENT account:
  // member A's set + the joint trust land on this matter (A owns it); member B's
  // mirror set lands on B's OWN matter, owned by B, so the survivor can always
  // reach their own will (docs/HOUSEHOLD_WORK_ORDER.md §2). A answers for both
  // (MVP §3.1); member B reviews. Reads here are all of A's own data; the writes
  // to B's matter go through the admin client, exactly as generation already
  // writes documents.
  const isHousehold = party === "couples" && !!matter.household_id;

  // Resolve member B and their matter (if B has joined). A can read household
  // members via RLS (is_household_member) — no service-role read of user data.
  let bUserId: string | null = null;
  let bMatterId: string | null = null;
  if (isHousehold) {
    const { data: memberRows } = await supabase
      .from("household_members")
      .select("user_id, role")
      .eq("household_id", matter.household_id as string);
    bUserId =
      (memberRows as { user_id: string; role: string }[] | null)?.find(
        (m) => m.role === "b",
      )?.user_id ?? null;

    if (bUserId) {
      const { data: existingB } = await admin
        .from("matters")
        .select("id")
        .eq("user_id", bUserId)
        .eq("household_id", matter.household_id as string)
        .maybeSingle();
      bMatterId = (existingB as { id: string } | null)?.id ?? null;
      if (!bMatterId) {
        const { data: createdB } = await admin
          .from("matters")
          .insert({
            user_id: bUserId,
            household_id: matter.household_id,
            doc_type: matter.doc_type,
            state: matter.state,
            status: "in_progress",
          })
          .select("id")
          .single();
        bMatterId = (createdB as { id: string } | null)?.id ?? null;
      }
    }
  }

  // Where a given signer's documents live: which matter, who owns them, whose
  // storage folder, and whether they are private or shared across the household.
  type Target = {
    matterId: string;
    owner: string;
    folder: string;
    scope: "private" | "household";
  };
  const targetFor = (signer: string): Target | null => {
    if (!isHousehold) {
      return { matterId, owner: user.id, folder: user.id, scope: "private" };
    }
    if (signer === "primary") {
      return { matterId, owner: user.id, folder: user.id, scope: "private" };
    }
    if (signer === "joint") {
      return { matterId, owner: user.id, folder: user.id, scope: "household" };
    }
    if (signer === "spouse") {
      return bUserId && bMatterId
        ? { matterId: bMatterId, owner: bUserId, folder: bUserId, scope: "private" }
        : null; // B hasn't joined yet — A can regenerate once they do (MVP §3.2)
    }
    return null;
  };

  const specs = documentSpecsFor(matter.doc_type, party);
  const rowsByMatter: Record<string, Record<string, unknown>[]> = {};

  try {
    for (const spec of specs) {
      const target = targetFor(spec.signer);
      if (!target) continue;

      const assembled = assembleDocument(spec, { answers, rulesets, party });
      const docx = await renderDocx(assembled);
      const pdf = await convertDocxToPdf(docx);

      const tpl = templateByKind.get(spec.kind);
      const version = tpl?.version ?? 1;
      // Each signer's set now lives on its own matter, so document kinds no
      // longer collide and the per-signer path tag is unnecessary.
      const base = `${target.folder}/${target.matterId}/${spec.kind}-v${version}`;

      await uploadDocument(`${base}.docx`, docx, DOCX_MIME);
      if (pdf) await uploadDocument(`${base}.pdf`, pdf, "application/pdf");

      (rowsByMatter[target.matterId] ??= []).push({
        matter_id: target.matterId,
        kind: spec.kind,
        version,
        template_version_id: tpl?.id ?? null,
        storage_path: `${base}.docx`,
        status: "generated",
        generated_at: new Date().toISOString(),
        owner_user_id: target.owner,
        scope: target.scope,
      });
    }
  } catch (err) {
    console.error("Document generation failed:", err);
    return { error: "We couldn't generate your documents. Please try again." };
  }

  // Replace prior documents on each affected matter (idempotent regeneration).
  // For a household that is A's matter (A's set + joint) and B's matter (B's set)
  // — each member's regeneration only ever touches their own matter's rows.
  const affectedMatters = Object.keys(rowsByMatter);
  for (const mid of affectedMatters) {
    await admin.from("documents").delete().eq("matter_id", mid);
  }
  const allRows = Object.values(rowsByMatter).flat();
  if (allRows.length) await admin.from("documents").insert(allRows);

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "documents_generated",
    entity: "matter",
    entity_id: matterId,
    metadata: {
      kinds: specs.map((sp) => sp.kind),
      party,
      household: isHousehold,
      partner_matter: bMatterId,
      state: matter.state,
      doc_type: matter.doc_type,
    },
  });
  for (const mid of affectedMatters) {
    await admin.from("matters").update({ status: "ready_to_sign" }).eq("id", mid);
  }

  if (user.email) {
    await sendDocumentsReadyEmail(user.email, {
      siteUrl: clientEnv.NEXT_PUBLIC_SITE_URL,
    });
  }

  redirect(`/interview/${matterId}/documents`);
}
