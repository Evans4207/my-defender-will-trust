"use server";

import { redirect } from "next/navigation";
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
  const { error } = await supabase.rpc("redeem_access_code", { p_code: code });

  if (error) return { error: mapRedeemError(error.message) };

  // Atomic redemption succeeded (or was idempotently already redeemed).
  redirect("/dashboard");
}
