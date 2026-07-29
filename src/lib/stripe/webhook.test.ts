import { describe, it, expect } from "vitest";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  handleStripeEvent,
  isFullyRefunded,
  subscriptionPeriodEnd,
} from "./webhook";

type Call = {
  table: string;
  op: "upsert" | "insert" | "update";
  values: Record<string, unknown>;
  opts?: unknown;
  eq?: [string, unknown];
  is?: [string, unknown];
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
      // `.eq()` is awaitable on its own and also chains into `.is()`, matching
      // the PostgREST builder closely enough for these assertions.
      const chain = {
        eq: (col: string, val: unknown) => {
          call.eq = [col, val];
          return Object.assign(Promise.resolve({ error: null }), {
            is: (c: string, v: unknown) => {
              call.is = [c, v];
              return Promise.resolve({ error: null });
            },
          });
        },
      };
      return chain;
    },
  });
  return { admin: { from } as unknown as SupabaseClient, calls };
}

function event(type: string, object: unknown): Stripe.Event {
  return { id: "evt_test", type, data: { object } } as unknown as Stripe.Event;
}

const grantCalls = (calls: Call[]) =>
  calls.filter((c) => c.table === "entitlement_grants");

describe("handleStripeEvent", () => {
  it("inserts a subscription row for a one-time package purchase", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(
      event("checkout.session.completed", {
        id: "cs_1",
        mode: "payment",
        customer: "cus_1",
        payment_intent: "pi_1",
        metadata: { user_id: "u1", plan: "will" },
      }),
      admin,
    );
    const sub = calls.find((c) => c.table === "subscriptions");
    expect(sub?.op).toBe("insert");
    expect(sub?.values).toMatchObject({
      user_id: "u1",
      plan: "will",
      status: "active",
    });
  });

  // The defect this replaces: access used to hang off subscriptions.status.
  it("grants a one-time purchase permanently, with no expiry", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(
      event("checkout.session.completed", {
        id: "cs_1",
        mode: "payment",
        customer: "cus_1",
        payment_intent: "pi_1",
        metadata: { user_id: "u1", plan: "trust" },
      }),
      admin,
    );
    const grants = grantCalls(calls);
    expect(grants).toHaveLength(1);
    expect(grants[0].op).toBe("upsert");
    expect(grants[0].opts).toEqual({ onConflict: "stripe_session_id" });
    expect(grants[0].values).toEqual({
      user_id: "u1",
      product: "trust",
      source: "purchase",
      stripe_session_id: "cs_1",
      stripe_payment_intent: "pi_1",
      expires_at: null,
    });
  });

  it("accepts an expanded payment_intent object", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(
      event("checkout.session.completed", {
        id: "cs_1",
        mode: "payment",
        payment_intent: { id: "pi_expanded" },
        metadata: { user_id: "u1", plan: "will" },
      }),
      admin,
    );
    expect(grantCalls(calls)[0].values.stripe_payment_intent).toBe("pi_expanded");
  });

  it("upserts a subscription for a membership checkout (keyed on stripe_sub_id)", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(
      event("checkout.session.completed", {
        id: "cs_1",
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

  // A membership grant with a null expiry would read as owned forever, so the
  // session event must not write one — only the subscription events know the end.
  it("writes no grant at membership checkout, only at subscription.created", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(
      event("checkout.session.completed", {
        id: "cs_1",
        mode: "subscription",
        subscription: "sub_1",
        metadata: { user_id: "u1", plan: "membership" },
      }),
      admin,
    );
    expect(grantCalls(calls)).toHaveLength(0);
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

  it("mirrors the period end onto the membership grant", async () => {
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
    const grants = grantCalls(calls);
    expect(grants).toHaveLength(1);
    expect(grants[0].opts).toEqual({ onConflict: "stripe_sub_id" });
    expect(grants[0].values).toMatchObject({
      user_id: "u1",
      product: "membership",
      stripe_sub_id: "sub_1",
      expires_at: new Date(1893456000 * 1000).toISOString(),
    });
  });

  it("writes no grant when the subscription carries no user_id", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(
      event("customer.subscription.updated", {
        id: "sub_1",
        customer: "cus_1",
        status: "active",
        metadata: {},
        items: { data: [{ current_period_end: 1893456000 }] },
      }),
      admin,
    );
    expect(grantCalls(calls)).toHaveLength(0);
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

  // A cancelled membership expires; it is not revoked. Expiry opens the
  // read-only grace window, revocation would not.
  it("expires the membership grant on subscription.deleted, without revoking", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(
      event("customer.subscription.deleted", { id: "sub_1" }),
      admin,
    );
    const grants = grantCalls(calls);
    expect(grants).toHaveLength(1);
    expect(grants[0].eq).toEqual(["stripe_sub_id", "sub_1"]);
    expect(Object.keys(grants[0].values)).toEqual(["expires_at"]);
    expect(typeof grants[0].values.expires_at).toBe("string");
  });

  it("revokes the grant on a full refund", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(
      event("charge.refunded", {
        payment_intent: "pi_1",
        amount: 15900,
        amount_refunded: 15900,
      }),
      admin,
    );
    const grants = grantCalls(calls);
    expect(grants).toHaveLength(1);
    expect(grants[0].op).toBe("update");
    expect(grants[0].values).toMatchObject({ revoked_reason: "refund" });
    expect(grants[0].eq).toEqual(["stripe_payment_intent", "pi_1"]);
    expect(grants[0].is).toEqual(["revoked_at", null]);
  });

  // A goodwill credit must not delete someone's estate plan.
  it("leaves the grant alone on a partial refund", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(
      event("charge.refunded", {
        payment_intent: "pi_1",
        amount: 15900,
        amount_refunded: 5000,
      }),
      admin,
    );
    expect(calls).toHaveLength(0);
  });

  it("revokes the grant on a chargeback", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(
      event("charge.dispute.created", { payment_intent: "pi_1" }),
      admin,
    );
    const grants = grantCalls(calls);
    expect(grants).toHaveLength(1);
    expect(grants[0].values).toMatchObject({ revoked_reason: "chargeback" });
    expect(grants[0].eq).toEqual(["stripe_payment_intent", "pi_1"]);
  });

  it("ignores a refund with no payment intent", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(
      event("charge.refunded", { amount: 100, amount_refunded: 100 }),
      admin,
    );
    expect(calls).toHaveLength(0);
  });

  it("no-ops on unhandled event types", async () => {
    const { admin, calls } = createMockAdmin();
    await handleStripeEvent(event("invoice.paid", {}), admin);
    expect(calls).toHaveLength(0);
  });
});

describe("isFullyRefunded", () => {
  const charge = (amount: number, refunded: number) =>
    ({ amount, amount_refunded: refunded }) as unknown as Stripe.Charge;

  it("is true when the full amount is refunded", () => {
    expect(isFullyRefunded(charge(15900, 15900))).toBe(true);
  });

  it("is true when partial refunds add up to the full amount", () => {
    expect(isFullyRefunded(charge(15900, 16000))).toBe(true);
  });

  it("is false for a partial refund", () => {
    expect(isFullyRefunded(charge(15900, 5000))).toBe(false);
  });

  it("is false for a zero-amount charge", () => {
    expect(isFullyRefunded(charge(0, 0))).toBe(false);
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
