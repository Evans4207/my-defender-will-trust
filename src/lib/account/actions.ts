"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * User-initiated account deletion (§8). Purges the user's storage objects, then
 * deletes the auth user — which cascades all their DB rows (profiles, matters +
 * children, subscriptions, redemptions, vault items, acknowledgments). Signs out
 * and returns home.
 */
export async function deleteAccountAction(formData: FormData): Promise<void> {
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== "DELETE") {
    // The UI enforces this; guard server-side too.
    redirect("/account?error=confirm");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Collect this user's storage objects (documents + PDF siblings + vault).
  const paths = new Set<string>();

  const { data: matters } = await admin.from("matters").select("id").eq("user_id", user.id);
  const matterIds = ((matters as { id: string }[] | null) ?? []).map((m) => m.id);
  if (matterIds.length) {
    const { data: docs } = await admin
      .from("documents")
      .select("storage_path")
      .in("matter_id", matterIds);
    for (const d of (docs as { storage_path: string | null }[] | null) ?? []) {
      if (d.storage_path) {
        paths.add(d.storage_path);
        paths.add(d.storage_path.replace(/\.docx$/, ".pdf"));
      }
    }
  }
  const { data: vault } = await admin
    .from("vault_items")
    .select("storage_path")
    .eq("user_id", user.id);
  for (const v of (vault as { storage_path: string }[] | null) ?? []) {
    paths.add(v.storage_path);
  }

  if (paths.size) {
    await admin.storage.from("documents").remove([...paths]);
  }

  await admin.from("audit_log").insert({
    user_id: user.id,
    action: "account_deleted",
    entity: "user",
    entity_id: user.id,
  });

  // Deletes the auth user; FK cascades remove all owned rows.
  await admin.auth.admin.deleteUser(user.id);

  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
