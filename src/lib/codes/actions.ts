"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeAccessCode, isValidAccessCodeFormat } from "@/lib/access-code";
import { checkRateLimit, getClientIp, TOO_MANY } from "@/lib/rate-limit";

export type RedeemState = { error?: string };

/** Map Postgres exception messages from redeem_access_code() to friendly copy. */
function mapRedeemError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid code")) {
    return "We couldn't find that code. Double-check it and try again.";
  }
  if (m.includes("expired")) return "That code has expired.";
  if (m.includes("inactive")) return "That code is no longer active.";
  if (m.includes("fully redeemed")) {
    return "That code has already been fully used.";
  }
  if (m.includes("not authenticated")) {
    return "Please log in and try again.";
  }
  return "We couldn't redeem that code. Please try again.";
}

export async function redeemCodeAction(
  _prev: RedeemState,
  formData: FormData,
): Promise<RedeemState> {
  const ip = await getClientIp();
  if (!(await checkRateLimit(`redeem:${ip}`, 10, 300))) return { error: TOO_MANY };

  const code = normalizeAccessCode(String(formData.get("code") ?? ""));
  if (!isValidAccessCodeFormat(code)) {
    return {
      error: "That code doesn't look right. Codes look like DFND-XXXX-XXXX.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_access_code", { p_code: code });

  if (error) return { error: mapRedeemError(error.message) };

  const row = (Array.isArray(data) ? data[0] : data) as
    | { grants_access?: boolean }
    | undefined;

  // The grant was just written by redeem_access_code(). Bust the cached layout so
  // the destination reads the fresh entitlement on this same navigation — without
  // this, the dashboard can render a stale "not unlocked" view and bounce a
  // brand-new user (no matters yet) straight back to the gate, which looks exactly
  // like the code being dead.
  revalidatePath("/", "layout");

  // Comp code (100% off) unlocks directly. Discount code (<100%) sends the user
  // to check out at the reduced price — the discount is applied automatically.
  if (row?.grants_access === false) {
    redirect("/gate?discount=1");
  }
  redirect("/dashboard?unlocked=1");
}
