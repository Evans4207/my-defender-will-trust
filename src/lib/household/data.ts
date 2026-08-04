import { createClient } from "@/lib/supabase/server";

/**
 * Household reads, all through the RLS-scoped user client (never the service
 * role). The migration-15 SELECT policies + security-definer helpers let a
 * member read their own household, its members and its invites.
 */

export type HouseholdRole = "a" | "b";

export interface MyHousehold {
  householdId: string;
  role: HouseholdRole;
}

/** The household the current user belongs to, with their role — or null. */
export async function getMyHousehold(): Promise<MyHousehold | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  const row = data as { household_id: string; role: HouseholdRole } | null;
  return row ? { householdId: row.household_id, role: row.role } : null;
}

export interface HouseholdMember {
  userId: string;
  role: HouseholdRole;
  joinedAt: string;
}

/** Both members of a household (RLS: visible only to members). */
export async function getHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("household_members")
    .select("user_id, role, joined_at")
    .eq("household_id", householdId)
    .order("role", { ascending: true });

  return ((data as { user_id: string; role: HouseholdRole; joined_at: string }[] | null) ?? []).map(
    (r) => ({ userId: r.user_id, role: r.role, joinedAt: r.joined_at }),
  );
}

export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

export interface LatestInvite {
  id: string;
  email: string;
  status: InviteStatus;
  expiresAt: string;
}

/** The most recent invite for a household (status derived; raw token not stored). */
export async function getLatestInvite(householdId: string): Promise<LatestInvite | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("household_invites")
    .select("id, email, expires_at, accepted_at, revoked_at, created_at")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = data as {
    id: string;
    email: string;
    expires_at: string;
    accepted_at: string | null;
    revoked_at: string | null;
  } | null;
  if (!row) return null;

  const status: InviteStatus = row.accepted_at
    ? "accepted"
    : row.revoked_at
      ? "revoked"
      : new Date(row.expires_at).getTime() <= Date.now()
        ? "expired"
        : "pending";

  return { id: row.id, email: row.email, status, expiresAt: row.expires_at };
}
