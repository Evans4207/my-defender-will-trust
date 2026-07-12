"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEntitlement } from "@/lib/entitlements.server";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export async function uploadVaultFileAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > MAX_BYTES) return { error: "File too large (max 20 MB)." };

  const entitlement = await getEntitlement();
  if (!entitlement.membership) return { error: "Membership required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const path = `${user.id}/vault/${randomUUID()}-${safeName}`;

  const { error: upErr } = await supabase.storage
    .from("documents")
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (upErr) return { error: "Upload failed. Please try again." };

  await supabase.from("vault_items").insert({
    user_id: user.id,
    name: file.name,
    storage_path: path,
    content_type: file.type || null,
    size_bytes: file.size,
  });

  revalidatePath("/vault");
  return {};
}

export async function deleteVaultFileAction(id: string): Promise<void> {
  const supabase = await createClient();
  // RLS ensures we only read our own item.
  const { data } = await supabase
    .from("vault_items")
    .select("id, storage_path")
    .eq("id", id)
    .maybeSingle();
  const item = data as { id: string; storage_path: string } | null;
  if (!item) return;

  await supabase.storage.from("documents").remove([item.storage_path]);
  await supabase.from("vault_items").delete().eq("id", id);
  revalidatePath("/vault");
}
