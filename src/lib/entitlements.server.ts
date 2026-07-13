import { createClient } from "@/lib/supabase/server";
import { computeEntitlement, type Entitlement } from "@/lib/entitlements";

/** Resolve the current user's entitlement from their own rows (RLS-scoped). */
export async function getEntitlement(): Promise<Entitlement> {
  const supabase = await createClient();
  const [subsRes, redsRes] = await Promise.all([
    supabase.from("subscriptions").select("status, plan"),
    supabase.from("code_redemptions").select("package, grants_access"),
  ]);

  return computeEntitlement({
    subscriptions:
      (subsRes.data as { status: string | null; plan: string | null }[] | null) ??
      [],
    redemptions:
      (redsRes.data as { package: string | null; grants_access: boolean | null }[] | null) ??
      [],
  });
}

export type PendingDiscount = { package: "will" | "trust"; discountPct: number };

/**
 * A discount code the user redeemed that hasn't been converted to a purchase
 * yet (grants_access = false). Used to apply the discount at checkout.
 */
export async function getPendingDiscount(): Promise<PendingDiscount | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("code_redemptions")
    .select("package, discount_pct, grants_access")
    .eq("grants_access", false)
    .order("redeemed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = data as
    | { package: string | null; discount_pct: number | null }
    | null;
  if (!row || (row.package !== "will" && row.package !== "trust")) return null;
  return { package: row.package, discountPct: Number(row.discount_pct ?? 0) };
}
