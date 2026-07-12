import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/** Best-effort client IP from proxy headers. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Fixed-window rate limit. Returns true if the request is ALLOWED. Fails OPEN
 * (returns true) if the limiter itself errors, so a limiter outage never locks
 * out legitimate users.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("rate_limit_hit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) return true;
    return data === true;
  } catch {
    return true;
  }
}

export const TOO_MANY = "Too many attempts. Please wait a bit and try again.";
