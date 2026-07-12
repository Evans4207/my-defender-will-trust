-- =============================================================================
-- Migration 0012 — Fixed-window rate limiting (§8)
-- Postgres-backed so it works on serverless without an external store. A
-- SECURITY DEFINER function atomically increments a per-(key, window) counter
-- and reports whether the caller is within the limit.
-- =============================================================================

create table public.rate_limits (
  key          text not null,
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (key, window_start)
);

alter table public.rate_limits enable row level security;
-- No policies: only the SECURITY DEFINER function (and service role) touch this.

-- Returns TRUE if the hit is allowed (count <= max within the window).
create or replace function public.rate_limit_hit(
  p_key text,
  p_max integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  -- Bucket the current time into a fixed window.
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limits (key, window_start, count)
  values (p_key, v_window_start, 1)
  on conflict (key, window_start)
  do update set count = public.rate_limits.count + 1
  returning count into v_count;

  return v_count <= p_max;
end;
$$;

-- Allow the browser clients to invoke the limiter.
grant execute on function public.rate_limit_hit(text, integer, integer) to anon, authenticated;

-- Housekeeping: prune old buckets (call from the reminders cron or manually).
create or replace function public.prune_rate_limits(p_older_than_seconds integer default 86400)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limits
  where window_start < now() - make_interval(secs => p_older_than_seconds);
$$;
