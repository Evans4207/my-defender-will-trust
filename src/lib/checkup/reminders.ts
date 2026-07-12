import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientEnv } from "@/lib/env";

/**
 * Find members whose annual estate checkup is due and email a reminder.
 * Intended to be invoked by a scheduled job (wired in Phase 7). Idempotency
 * across runs should be added there (e.g. a last_reminder_sent stamp).
 */
export async function sendDueCheckupReminders(today = new Date()): Promise<number> {
  const admin = createAdminClient();
  const cutoff = today.toISOString().slice(0, 10);

  const { data } = await admin
    .from("profiles")
    .select("user_id, next_checkup_due")
    .lte("next_checkup_due", cutoff);
  const due = (data as { user_id: string }[] | null) ?? [];

  let sent = 0;
  for (const p of due) {
    const { data: userRes } = await admin.auth.admin.getUserById(p.user_id);
    const email = userRes.user?.email;
    if (!email) continue;
    await sendCheckupReminderEmail(email);
    sent++;
  }
  return sent;
}

async function sendCheckupReminderEmail(to: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] checkup reminder (no RESEND_API_KEY) -> ${to}`);
    return;
  }
  const from =
    process.env.EMAIL_FROM ?? "My Defender Will & Trust <noreply@mydefenderplan.com>";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject: "Time for your annual estate checkup",
        html: `<p>Has anything changed this year — marriage, a birth, a move, a home purchase?</p>
<p><a href="${clientEnv.NEXT_PUBLIC_SITE_URL}/checkup">Start your annual estate checkup</a></p>`,
      }),
    });
  } catch (err) {
    console.error("Checkup reminder failed:", err);
  }
}
