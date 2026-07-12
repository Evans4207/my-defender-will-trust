"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isValidStateCode } from "@/lib/interview/states";

export type WaitlistState = { message?: string; error?: string };

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email."),
  state: z.string().refine(isValidStateCode, "Invalid state."),
});

/** Capture an email for an excluded/unavailable state (§5.4). Open to anyone. */
export async function joinWaitlistAction(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    state: formData.get("state"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("state_waitlist").insert({
    email: parsed.data.email,
    state_code: parsed.data.state,
    user_id: user?.id ?? null,
  });
  if (error) return { error: "Something went wrong. Please try again." };

  return { message: "You're on the list — we'll email you when your state opens." };
}
