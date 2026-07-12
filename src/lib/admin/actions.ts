"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/role";
import { CODE_ALPHABET } from "@/lib/access-code";

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Forbidden");
}

/** Generate a human-typeable code: DFND-XXXX-XXXX (unambiguous charset). */
export async function generateAccessCode(): Promise<string> {
  const pick = () =>
    Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
  return `DFND-${pick()}-${pick()}`;
}

export async function createPartnerAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const contact = String(formData.get("contact") ?? "").trim() || null;
  const discountPct = Number(formData.get("discount_pct") ?? 50);
  const defaultPackage = String(formData.get("default_package") ?? "");

  const supabase = await createClient();
  await supabase.from("partners").insert({
    name,
    contact,
    discount_pct: Number.isFinite(discountPct) ? discountPct : 50,
    default_package: defaultPackage === "will" || defaultPackage === "trust" ? defaultPackage : null,
  });
  revalidatePath("/admin/partners");
}

export async function createCodeBatchAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const partnerId = String(formData.get("partner_id") ?? "");
  const count = Math.min(500, Math.max(1, Number(formData.get("count") ?? 10)));
  const pkg = String(formData.get("package") ?? "will");
  const maxUses = Math.max(1, Number(formData.get("max_uses") ?? 1));
  const discountRaw = formData.get("discount_pct");
  const discountPct = discountRaw === null || discountRaw === "" ? null : Number(discountRaw);
  const expiresRaw = String(formData.get("expires_at") ?? "").trim();
  const expiresAt = expiresRaw ? new Date(expiresRaw).toISOString() : null;
  if (!partnerId || (pkg !== "will" && pkg !== "trust")) return;

  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      code: await generateAccessCode(),
      partner_id: partnerId,
      package: pkg,
      max_uses: maxUses,
      discount_pct: discountPct,
      expires_at: expiresAt,
    });
  }

  const supabase = await createClient();
  // Low collision probability over 30^8; on the rare unique conflict, retry once.
  const { error } = await supabase.from("access_codes").insert(rows);
  if (error) {
    for (const r of rows) {
      await supabase.from("access_codes").insert({ ...r, code: await generateAccessCode() });
    }
  }
  revalidatePath("/admin/codes");
  revalidatePath("/admin/partners");
}

// --- Template approval workflow (§7) ---------------------------------------

export async function approveTemplateAction(id: string): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase
    .from("template_versions")
    .update({ approved_by: user?.id ?? null, approved_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin/templates");
}

export async function activateTemplateAction(id: string, kind: string): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  // Only one active version per kind.
  await supabase.from("template_versions").update({ active: false }).eq("kind", kind);
  await supabase.from("template_versions").update({ active: true }).eq("id", id);
  revalidatePath("/admin/templates");
}

export async function deactivateTemplateAction(id: string): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  await supabase.from("template_versions").update({ active: false }).eq("id", id);
  revalidatePath("/admin/templates");
}

// --- State rules editor (§7) ------------------------------------------------

export async function toggleStateAvailabilityAction(code: string, available: boolean): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  await supabase.from("state_availability").upsert(
    { state_code: code, available },
    { onConflict: "state_code" },
  );
  revalidatePath("/admin/state-rules");
  revalidatePath("/states");
}

export async function setQaApprovedAction(code: string, approved: boolean): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  await supabase.from("state_availability").update({ qa_approved: approved }).eq("state_code", code);
  revalidatePath("/admin/state-rules");
}

export async function updateStateRuleAction(id: string, formData: FormData): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  const citation = String(formData.get("citation") ?? "").trim() || null;
  const effective = String(formData.get("effective_date") ?? "").trim() || null;
  const needsReview = formData.get("needs_review") === "on";
  await supabase
    .from("state_rules")
    .update({ citation, effective_date: effective, needs_review: needsReview })
    .eq("id", id);
  const code = String(formData.get("state_code") ?? "");
  revalidatePath(`/admin/state-rules/${code}`);
}
