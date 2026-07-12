-- =============================================================================
-- Migration 0007 — Interview funnel events + resume pointer
-- Phase 2 acceptance: "funnel events logged per step" and resume support.
-- =============================================================================

-- Resume pointer: which step the user should return to.
alter table public.matters
  add column if not exists current_step text;

-- Funnel events (viewed / completed per step, plus started).
create table public.interview_events (
  id         uuid primary key default gen_random_uuid(),
  matter_id  uuid not null references public.matters (id) on delete cascade,
  user_id    uuid references auth.users (id) on delete set null,
  step_key   text,
  event_type text not null, -- 'interview_started' | 'step_viewed' | 'step_completed'
  created_at timestamptz not null default now()
);

create index interview_events_matter_idx on public.interview_events (matter_id);
create index interview_events_funnel_idx
  on public.interview_events (event_type, step_key);

alter table public.interview_events enable row level security;

-- Users may log events for their own matters; admins read all (funnel metrics).
create policy interview_events_insert on public.interview_events
  for insert with check (public.owns_matter(matter_id));
create policy interview_events_admin_read on public.interview_events
  for select using (public.is_admin());
