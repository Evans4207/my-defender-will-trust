import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Core Stripe event handler — pure domain logic, no HTTP/signature concerns
 * (those live in the route). Takes a service-role Supabase client so it can
 * write the RLS-protected subscriptions table. Unit-tested with mock clients.
 *
 * Idempotency across redeliveries is enforced by the route via `stripe_events`;
 * within a single event, subscription upserts key on `stripe_sub_id`.
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
      } else {
        // One-time package purchase grants entitlement. Idempotent because the
        // route guards on event id before we ever reach this insert.
        await admin.from("subscriptions").insert({
          user_id: userId,
          plan,
          status: "active",
          stripe_customer_id: (session.customer as string) ?? null,
        });
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await admin.from("subscriptions").upsert(
        {
          user_id: sub.metadata?.user_id ?? undefined,
          plan: sub.metadata?.plan ?? "membership",
          status: sub.status,
          stripe_customer_id: sub.customer as string,
          stripe_sub_id: sub.id,
          current_period_end: subscriptionPeriodEnd(sub),
        },
        { onConflict: "stripe_sub_id" },
      );
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await admin
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_sub_id", sub.id);
      break;
    }

    default:
      // Unhandled event types are acknowledged (200) without action.
      break;
  }
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
