import { createClient } from "@/lib/supabase/server";
import { computeEntitlement, type Entitlement } from "@/lib/entitlements";

/** Resolve the current user's entitlement from their own rows (RLS-scoped). */
export async function getEntitlement(): Promise<Entitlement> {
  const supabase = await createClient();
  const [subsRes, redsRes] = await Promise.all([
    supabase.from("subscriptions").select("status, plan"),
    supabase.from("code_redemptions").select("package"),
  ]);

  return computeEntitlement({
    subscriptions:
      (subsRes.data as { status: string | null; plan: string | null }[] | null) ??
      [],
    redemptions: (redsRes.data as { package: string | null }[] | null) ?? [],
  });
}
