-- =============================================================================
-- Migration 0006 — Stripe webhook idempotency
-- Records processed Stripe event IDs so redelivered events are handled exactly
-- once ("webhook failures retry safely" — Phase 1 acceptance). Only the service
-- role touches this table (RLS enabled, no policies).
-- =============================================================================

create table public.stripe_events (
  id           text primary key, -- Stripe event id (evt_...)
  type         text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- No policies: only the service_role (which bypasses RLS) may read/write.
