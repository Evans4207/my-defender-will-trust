import { type NextRequest, NextResponse } from "next/server";
import { sendDueCheckupReminders } from "@/lib/checkup/reminders";

/**
 * Scheduled reminder job (annual estate checkup + "life changes? update your
 * documents"). Secret-gated so only the scheduler can trigger it. Wire via
 * vercel.json cron (daily) with the CRON_SECRET env var.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const sent = await sendDueCheckupReminders();
    return NextResponse.json({ ok: true, checkupRemindersSent: sent });
  } catch (err) {
    console.error("Reminder cron failed:", err);
    return new NextResponse("Reminder job failed", { status: 500 });
  }
}
