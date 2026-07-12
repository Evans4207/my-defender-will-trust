"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Mark this year's estate checkup complete and schedule the next one (+1 year). */
export async function completeCheckupAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const now = new Date();
  const next = new Date(now);
  next.setFullYear(next.getFullYear() + 1);

  await supabase
    .from("profiles")
    .update({
      last_checkup_at: now.toISOString(),
      next_checkup_due: next.toISOString().slice(0, 10),
    })
    .eq("user_id", user.id);

  revalidatePath("/checkup");
}
