"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { clientEnv } from "@/lib/env";
import { getEntitlement } from "@/lib/entitlements.server";
import { generateInviteToken, hashInviteToken, INVITE_TTL_DAYS } from "./token";
import { sendHouseholdInviteEmail } from "./email";

export type HouseholdActionState = {
  error?: string;
  /** The raw invite link — shown once, right after issuing, for the copy fallback. */
  link?: string;
  /** True when the email actually went out (Resend configured). */
  emailed?: boolean;
};

async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : clientEnv.NEXT_PUBLIC_SITE_URL;
}

/** Map a Postgres RPC error to friendly copy; fall back to a generic message. */
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("not_authenticated")) return "Please log in and try again.";
  if (m.includes("not_household_owner")) return "Only the account that started the household can do that.";
  if (m.includes("cannot_accept_own")) return "This is your own invitation — share it with your partner.";
  if (m.includes("already_in_household")) return "You're already part of a household.";
  if (m.includes("invite_not_found")) return "This invitation link isn't valid.";
  if (m.includes("invite_revoked")) return "This invitation was cancelled. Ask for a new link.";
  if (m.includes("invite_expired")) return "This invitation has expired. Ask for a new link.";
  if (m.includes("invite_already_used")) return "This invitation has already been used.";
  return "Something went wrong. Please try again.";
}

/**
 * Start (or resume) a household for the current entitled user, as member A.
 * Requires an unlocked entitlement — you can't form a household without owning a
 * plan. Idempotent via the create_household RPC.
 */
export async function startHouseholdAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/household");

  const entitlement = await getEntitlement();
  if (!entitlement.unlocked) redirect("/gate");

  const { error } = await supabase.rpc("create_household");
  if (error) throw new Error(error.message);

  redirect("/household");
}

/** Issue (or re-issue) the single live invite; returns the raw link for copying. */
export async function createInviteAction(
  _prev: HouseholdActionState,
  formData: FormData,
): Promise<HouseholdActionState> {
  const email = String(formData.get("email") || "").trim();
  if (!email || !email.includes("@")) {
    return { error: "Enter your partner's email address." };
  }

  const supabase = await createClient();
  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.rpc("issue_household_invite", {
    p_email: email,
    p_token_hash: tokenHash,
    p_expires_at: expiresAt,
  });
  if (error) return { error: friendly(error.message) };

  const origin = await getOrigin();
  const link = `${origin}/join/${token}`;
  const emailed = await sendHouseholdInviteEmail(email, { inviteUrl: link });

  revalidatePath("/household");
  return { link, emailed };
}

/** Revoke the outstanding invite. */
export async function revokeInviteAction(formData: FormData): Promise<void> {
  const inviteId = String(formData.get("inviteId") || "");
  if (!inviteId) return;
  const supabase = await createClient();
  await supabase.rpc("revoke_household_invite", { p_invite_id: inviteId });
  revalidatePath("/household");
}

/** Partner B accepts an invite by its raw token (hashed here before lookup). */
export async function acceptInviteAction(
  _prev: HouseholdActionState,
  formData: FormData,
): Promise<HouseholdActionState> {
  const token = String(formData.get("token") || "").trim();
  if (!token) return { error: "This invitation link isn't valid." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please create your account or log in first." };

  const { error } = await supabase.rpc("accept_household_invite", {
    p_token_hash: hashInviteToken(token),
  });
  if (error) return { error: friendly(error.message) };

  redirect("/dashboard?household=joined");
}
