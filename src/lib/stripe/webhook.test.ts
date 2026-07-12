import { describe, it, expect } from "vitest";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleStripeEvent, subscriptionPeriodEnd } from "./webhook";

type Call = {
  table: string;
  op: "upsert" | "insert" | "update";
  values: Record<string, unknown>;
  opts?: unknown;
  eq?: [string, unknown];
};

/** Minimal chainable mock of the Supabase client that records writes. */
function createMockAdmin() {
  const calls: Call[] = [];
  const from = (table: string) => ({
    upsert: (values: Record<string, unknown>, opts?: unknown) => {
      calls.push({ table, op: "upsert", values, opts });
      return Promise.resolve({ error: null });
    },
    insert: (values: Record<string, unknown>) => {
      calls.push({ table, op: "insert", values });
      return Promise.resolve({ error: null });
    },
    update: (values: Record<string, unknown>) => {
      const call: Call = { table, op: "update", values };
      calls.push(call);
      return {
        eq: (col: string, val: unknown) => {
          call.eq = [col, val];
          return Promise.resolve({ error: null });
        },
      };
    },
  });
  return { admin: { from } as unknown as SupabaseClient, calls };
}

function event(type: string, object: unknown): Stripe.Event {
  return { id: "evt_test", type, data: { object } } as unknown as Stripe.Event;
}

describe("handleStripeEvent", () => {
  it("inserts a subscription row for a one-time package purchase", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(
      event("checkout.session.completed", {
        mode: "payment",
        customer: "cus_1",
        metadata: { user_id: "u1", plan: "will" },
      }),
      admin,
    );
    expect(calls).toHaveLength(1);
    expect(calls[0].table).toBe("subscriptions");
    expect(calls[0].op).toBe("insert");
    expect(calls[0].values).toMatchObject({
      user_id: "u1",
      plan: "will",
      status: "active",
    });
  });

  it("upserts a subscription for a membership checkout (keyed on stripe_sub_id)", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(
      event("checkout.session.completed", {
        mode: "subscription",
        customer: "cus_1",
        subscription: "sub_1",
        metadata: { user_id: "u1", plan: "membership" },
      }),
      admin,
    );
    expect(calls[0].op).toBe("upsert");
    expect(calls[0].opts).toEqual({ onConflict: "stripe_sub_id" });
    expect(calls[0].values).toMatchObject({ stripe_sub_id: "sub_1", plan: "membership" });
  });

  it("ignores checkout sessions missing user_id or plan", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(
      event("checkout.session.completed", { mode: "payment", metadata: {} }),
      admin,
    );
    expect(calls).toHaveLength(0);
  });

  it("upserts status + period end on subscription.updated", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(
      event("customer.subscription.updated", {
        id: "sub_1",
        customer: "cus_1",
        status: "active",
        metadata: { user_id: "u1", plan: "membership" },
        items: { data: [{ current_period_end: 1893456000 }] },
      }),
      admin,
    );
    expect(calls[0].op).toBe("upsert");
    expect(calls[0].values).toMatchObject({ stripe_sub_id: "sub_1", status: "active" });
    expect(calls[0].values.current_period_end).toBe(
      new Date(1893456000 * 1000).toISOString(),
    );
  });

  it("marks a subscription canceled on subscription.deleted", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(
      event("customer.subscription.deleted", { id: "sub_1" }),
      admin,
    );
    expect(calls[0].op).toBe("update");
    expect(calls[0].values).toEqual({ status: "canceled" });
    expect(calls[0].eq).toEqual(["stripe_sub_id", "sub_1"]);
  });

  it("no-ops on unhandled event types", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(event("invoice.paid", {}), admin);
    expect(calls).toHaveLength(0);
  });
});

describe("subscriptionPeriodEnd", () => {
  it("prefers the item-level period end (newer Stripe API)", () => {
    const sub = {
      items: { data: [{ current_period_end: 1893456000 }] },
    } as unknown as Stripe.Subscription;
    expect(subscriptionPeriodEnd(sub)).toBe(new Date(1893456000 * 1000).toISOString());
  });

  it("falls back to the top-level period end", () => {
    const sub = { current_period_end: 1893456000 } as unknown as Stripe.Subscription;
    expect(subscriptionPeriodEnd(sub)).toBe(new Date(1893456000 * 1000).toISOString());
  });

  it("returns null when absent", () => {
    expect(subscriptionPeriodEnd({} as Stripe.Subscription)).toBe(null);
  });
});
