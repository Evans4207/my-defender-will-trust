import { createClient } from "@/lib/supabase/server";
import {
  computeEntitlement,
  type Entitlement,
  type GrantRow,
} from "@/lib/entitlements";

/**
 * Resolve the current user's entitlement from `entitlement_grants` (RLS-scoped,
 * so a user can only ever read their own grants).
 *
 * `subscriptions` is deliberately NOT consulted here. It mirrors Stripe's own
 * state for the billing portal; access is resolved from grants, where a one-time
 * purchase carries no expiry and therefore cannot lapse.
 */
export async function getEntitlement(): Promise<Entitlement> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("entitlement_grants")
    .select("product, source, granted_at, expires_at, revoked_at");

  return computeEntitlement({
    grants: (data as GrantRow[] | null) ?? [],
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
