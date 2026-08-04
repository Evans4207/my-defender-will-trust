import "server-only";

/**
 * Household invite email via Resend. No-ops (logs) when RESEND_API_KEY is unset —
 * which it currently is, so the invite screen ALWAYS also shows a copy-the-link
 * fallback (docs/HOUSEHOLD_WORK_ORDER.md §2). Returns whether it actually sent.
 */
export async function sendHouseholdInviteEmail(
  to: string,
  opts: { inviteUrl: string; inviterName?: string },
): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] RESEND_API_KEY unset — invite to ${to} not sent (use the copy link)`);
    return false;
  }
  const from =
    process.env.EMAIL_FROM ??
    "My Defender Will & Trust <noreply@mydefenderplan.com>";
  const who = opts.inviterName ? `${opts.inviterName} has` : "Someone has";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: "You've been invited to your family's estate plan",
        html: `<p>${who} invited you to create your own account and your own documents as part of your household plan on My Defender Will &amp; Trust.</p>
<p><a href="${opts.inviteUrl}">Accept the invitation</a></p>
<p style="color:#888;font-size:12px">This link is personal to you and expires soon. My Defender Will &amp; Trust is not a law firm and does not provide legal advice. This is self-help document preparation software.</p>`,
      }),
    });
    return true;
  } catch (err) {
    console.error("Resend invite delivery failed:", err);
    return false;
  }
}
