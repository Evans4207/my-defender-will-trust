import "server-only";

/**
 * Transactional email via Resend. No-ops (logs) when RESEND_API_KEY is unset so
 * generation works before email is configured (build plan §2 — Resend/Postmark).
 */
export async function sendDocumentsReadyEmail(
  to: string,
  opts: { siteUrl: string },
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] RESEND_API_KEY unset — skipping delivery to ${to}`);
    return;
  }
  const from =
    process.env.EMAIL_FROM ??
    "My Defender Will & Trust <noreply@mydefenderplan.com>";
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
        subject: "Your documents are ready",
        html: `<p>Your documents are ready to review and download.</p>
<p><a href="${opts.siteUrl}/dashboard">Go to your dashboard</a></p>
<p style="color:#888;font-size:12px">My Defender Will &amp; Trust is not a law firm and does not provide legal advice. This is self-help document preparation software.</p>`,
      }),
    });
  } catch (err) {
    console.error("Resend delivery failed:", err);
  }
}
