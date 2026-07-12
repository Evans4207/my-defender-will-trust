import { createClient } from "@/lib/supabase/server";

export type AppRole = "user" | "reviewer" | "admin";

/** Current user's app role (defaults to "user"). */
export async function getRole(): Promise<AppRole> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "user";
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  const role = (data as { role?: string } | null)?.role;
  return role === "admin" || role === "reviewer" ? role : "user";
}

export async function isAdmin(): Promise<boolean> {
  return (await getRole()) === "admin";
}
