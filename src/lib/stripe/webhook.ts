import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Core Stripe event handler — pure domain logic, no HTTP/signature concerns
 * (those live in the route). Takes a service-role Supabase client so it can
 * write the RLS-protected subscriptions and entitlement_grants tables.
 * Unit-tested with mock clients.
 *
 * Two tables, two jobs:
 *
 *   subscriptions      mirrors Stripe's own state, for the billing portal and
 *                      period-end display. Not consulted for access.
 *   entitlement_grants the source of truth for access. A one-time package
 *                      purchase gets `expires_at = null` and never lapses;
 *                      a membership carries the real period end; a refund or
 *                      chargeback writes `revoked_at` with a reason.
 *
 * Idempotency across redeliveries is enforced by the route via `stripe_events`;
 * within a single event, grants key on `stripe_session_id` or `stripe_sub_id`.
 */
export async function handleStripeEvent(
  event: Stripe.Event,
  admin: SupabaseClient,
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id ?? session.client_reference_id ?? undefined;
      const plan = session.metadata?.plan;
      if (!userId || !plan) return;

      if (session.mode === "subscription") {
        // Membership: mirror the subscription; period end arrives via sub.updated.
        await admin.from("subscriptions").upsert(
          {
            user_id: userId,
            plan,
            status: "active",
            stripe_customer_id: (session.customer as string) ?? null,
            stripe_sub_id: (session.subscription as string) ?? null,
          },
          { onConflict: "stripe_sub_id" },
        );
        // The membership GRANT is written by customer.subscription.created /
        // .updated, which are the only events that carry a real period end. A
        // membership grant with a null expiry would read as owned forever.
      } else {
        // One-time package purchase. Mirror it for billing history, then grant
        // permanent ownership: no expiry, so nothing can make it lapse.
        await admin.from("subscriptions").insert({
          user_id: userId,
          plan,
          status: "active",
          stripe_customer_id: (session.customer as string) ?? null,
        });

        await admin.from("entitlement_grants").upsert(
          {
            user_id: userId,
            product: plan,
            source: "purchase",
            stripe_session_id: session.id,
            stripe_payment_intent: paymentIntentId(session.payment_intent),
            expires_at: null,
          },
          { onConflict: "stripe_session_id" },
        );
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id ?? undefined;
      const plan = sub.metadata?.plan ?? "membership";
      const periodEnd = subscriptionPeriodEnd(sub);

      await admin.from("subscriptions").upsert(
        {
          user_id: userId,
          plan,
          status: sub.status,
          stripe_customer_id: sub.customer as string,
          stripe_sub_id: sub.id,
          current_period_end: periodEnd,
        },
        { onConflict: "stripe_sub_id" },
      );

      // Mirror the period end onto the grant. Without a user_id we cannot
      // attribute a grant, so skip rather than write an orphan row.
      if (userId) {
        await admin.from("entitlement_grants").upsert(
          {
            user_id: userId,
            product: plan,
            source: "purchase",
            stripe_sub_id: sub.id,
            expires_at: periodEnd,
          },
          { onConflict: "stripe_sub_id" },
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await admin
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_sub_id", sub.id);

      // A cancelled membership EXPIRES — it is not revoked. Expiry starts the
      // read-only grace window; revocation is reserved for refunds and disputes.
      await admin
        .from("entitlement_grants")
        .update({ expires_at: nowIso() })
        .eq("stripe_sub_id", sub.id);
      break;
    }

    // A refund removes the entitlement it paid for. Partial refunds do not:
    // a goodwill credit should not delete the customer's documents.
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      if (!isFullyRefunded(charge)) break;
      await revokeByPaymentIntent(admin, charge.payment_intent, "refund");
      break;
    }

    // A chargeback pulls the funds immediately. Revoke on creation rather than
    // waiting for the dispute to close, and restore manually if we win.
    case "charge.dispute.created": {
      const dispute = event.data.object as Stripe.Dispute;
      await revokeByPaymentIntent(admin, dispute.payment_intent, "chargeback");
      break;
    }

    default:
      // Unhandled event types are acknowledged (200) without action.
      break;
  }
}

/** Current time as an ISO string. Extracted so tests can stub it if needed. */
function nowIso(): string {
  return new Date().toISOString();
}

/** Stripe gives us either an id or an expanded object. Normalise to the id. */
function paymentIntentId(
  value: string | Stripe.PaymentIntent | null | undefined,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/**
 * True only when the whole charge has been refunded. `amount_refunded` is
 * cumulative across partial refunds, so this also catches the case where a
 * series of partials eventually adds up to the full amount.
 */
export function isFullyRefunded(charge: Stripe.Charge): boolean {
  const amount = charge.amount ?? 0;
  const refunded = charge.amount_refunded ?? 0;
  return amount > 0 && refunded >= amount;
}

/** Revoke every grant paid for by this payment intent, recording why. */
async function revokeByPaymentIntent(
  admin: SupabaseClient,
  paymentIntent: string | Stripe.PaymentIntent | null | undefined,
  reason: "refund" | "chargeback",
): Promise<void> {
  const id = paymentIntentId(paymentIntent);
  if (!id) return;
  await admin
    .from("entitlement_grants")
    .update({ revoked_at: nowIso(), revoked_reason: reason })
    .eq("stripe_payment_intent", id)
    .is("revoked_at", null);
}

/**
 * Resolve the subscription period end as an ISO string. Newer Stripe API
 * versions moved `current_period_end` onto subscription items, so check there
 * first and fall back to the top-level field.
 */
export function subscriptionPeriodEnd(sub: Stripe.Subscription): string | null {
  const itemEnd = sub.items?.data?.[0]?.current_period_end;
  const topEnd = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  const epoch = itemEnd ?? topEnd;
  return typeof epoch === "number" ? new Date(epoch * 1000).toISOString() : null;
}
