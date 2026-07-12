-- =============================================================================
-- Migration 0009 — Disclaimer acknowledgment tracking (§8, Phase 4)
-- Every generated document must have a logged affirmative acknowledgment of the
-- self-help disclaimer. This is the audit record.
-- =============================================================================

create table public.disclaimer_acknowledgments (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  matter_id          uuid references public.matters (id) on delete set null,
  disclaimer_version text not null,
  context            text, -- e.g. 'generation'
  ip                 inet,
  acknowledged_at    timestamptz not null default now()
);

create index disclaimer_acks_user_idx on public.disclaimer_acknowledgments (user_id);
create index disclaimer_acks_matter_idx on public.disclaimer_acknowledgments (matter_id);

alter table public.disclaimer_acknowledgments enable row level security;

-- Users can see their own acknowledgments; admins can read all. Writes happen
-- server-side (service role) during generation.
create policy disclaimer_acks_own_select on public.disclaimer_acknowledgments
  for select using (user_id = auth.uid() or public.is_admin());
