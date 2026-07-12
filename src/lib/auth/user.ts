import { createClient } from "@/lib/supabase/server";

/** Current authenticated user (or null). Safe in Server Components. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
