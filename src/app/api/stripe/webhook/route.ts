import { type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleStripeEvent } from "@/lib/stripe/webhook";

/**
 * Stripe webhook endpoint. Verifies the signature against the raw body, then
 * processes each event exactly once (guarded by the stripe_events table).
 * Returns 5xx on transient failure so Stripe retries; 400 on bad signature.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const body = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency guard: record the event id first. A duplicate means we've
  // already processed it, so acknowledge without re-running side effects.
  const { error: guardError } = await admin
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });

  if (guardError) {
    // 23505 = unique_violation → already processed.
    if ((guardError as { code?: string }).code === "23505") {
      return Response.json({ received: true, duplicate: true });
    }
    // Unexpected DB error → 500 so Stripe retries later.
    return new Response("Idempotency store error", { status: 500 });
  }

  try {
    await handleStripeEvent(event, admin);
  } catch (err) {
    console.error("Stripe handler error:", err);
    // Roll back the guard so the retry can reprocess this event.
    await admin.from("stripe_events").delete().eq("id", event.id);
    return new Response("Handler error", { status: 500 });
  }

  return Response.json({ received: true });
}
