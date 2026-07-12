"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAnswers } from "@/lib/interview/data";

function path(matterId: string) {
  return `/interview/${matterId}/funding`;
}

export async function addFundingItemAction(
  matterId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const label = String(formData.get("asset_label") ?? "").trim();
  const category = String(formData.get("category") ?? "other");
  if (!label) return { error: "Enter an asset." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("funding_items")
    .insert({ matter_id: matterId, asset_label: label, category });
  if (error) return { error: "Could not add that item." };

  revalidatePath(path(matterId));
  return {};
}

export async function toggleFundingRetitledAction(
  id: string,
  matterId: string,
  retitled: boolean,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("funding_items").update({ retitled }).eq("id", id);
  revalidatePath(path(matterId));
}

export async function removeFundingItemAction(
  id: string,
  matterId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("funding_items").delete().eq("id", id);
  revalidatePath(path(matterId));
}

/** Seed funding items from the interview's assets step (real estate + accounts). */
export async function prefillFundingFromAssetsAction(
  matterId: string,
): Promise<void> {
  const supabase = await createClient();
  const answers = await getAnswers(matterId);
  const assets = answers.assets ?? {};
  const realEstate = Array.isArray(assets.realEstate) ? assets.realEstate : [];
  const accounts = Array.isArray(assets.accounts) ? assets.accounts : [];

  const rows: { matter_id: string; asset_label: string; category: string }[] = [];
  for (const re of realEstate as { description?: unknown }[]) {
    const label = typeof re.description === "string" ? re.description.trim() : "";
    if (label) rows.push({ matter_id: matterId, asset_label: label, category: "real_estate" });
  }
  for (const ac of accounts as { institution?: unknown }[]) {
    const label = typeof ac.institution === "string" ? ac.institution.trim() : "";
    if (label) rows.push({ matter_id: matterId, asset_label: label, category: "account" });
  }
  if (rows.length) await supabase.from("funding_items").insert(rows);
  revalidatePath(path(matterId));
}
