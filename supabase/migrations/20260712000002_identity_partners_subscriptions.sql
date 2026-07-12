-- =============================================================================
-- Migration 0002 — Identity (profiles), partners, access codes, subscriptions
-- Build plan §4, §6 (Partner Code System).
-- Note: `auth.users` is Supabase-managed and is the canonical user table
-- referenced by the plan's `users (id, email, ...)`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles — 1:1 with auth.users
-- -----------------------------------------------------------------------------
create table public.profiles (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  full_name      text,
  state          text, -- 2-letter code; nullable until state-selection step
  marital_status text,
  role           public.app_role not null default 'user',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- partners + access_codes + code_redemptions  (§6)
-- -----------------------------------------------------------------------------
create table public.partners (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  contact         text,
  default_package public.doc_type,
  discount_pct    numeric(5, 2) not null default 50.00 check (discount_pct >= 0 and discount_pct <= 100),
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger partners_set_updated_at
  before update on public.partners
  for each row execute function public.set_updated_at();

create table public.access_codes (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique, -- format DFND-XXXX-XXXX (unambiguous chars)
  partner_id   uuid not null references public.partners (id) on delete cascade,
  package      public.doc_type not null,
  discount_pct numeric(5, 2) check (discount_pct >= 0 and discount_pct <= 100), -- null => inherit partner
  max_uses     integer not null default 1 check (max_uses >= 1),
  uses         integer not null default 0 check (uses >= 0),
  expires_at   timestamptz,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  constraint uses_within_cap check (uses <= max_uses)
);

create index access_codes_partner_id_idx on public.access_codes (partner_id);

create table public.code_redemptions (
  id          uuid primary key default gen_random_uuid(),
  code_id     uuid not null references public.access_codes (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  unique (code_id, user_id) -- a user can't redeem the same code twice
);

create index code_redemptions_user_id_idx on public.code_redemptions (user_id);

-- Atomic redemption: locks the code row to prevent races on max_uses (§6).
-- Returns the effective package + discount, or raises on invalid/exhausted.
create or replace function public.redeem_access_code(p_code text)
returns table (
  code_id      uuid,
  partner_id   uuid,
  package      public.doc_type,
  discount_pct numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code public.access_codes%rowtype;
  v_partner_discount numeric;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- Lock the row for the duration of the transaction.
  select * into v_code
  from public.access_codes
  where code = p_code
  for update;

  if not found then
    raise exception 'invalid code' using errcode = 'P0002';
  end if;

  if not v_code.active then
    raise exception 'code inactive' using errcode = 'P0001';
  end if;

  if v_code.expires_at is not null and v_code.expires_at < now() then
    raise exception 'code expired' using errcode = 'P0001';
  end if;

  if v_code.uses >= v_code.max_uses then
    raise exception 'code fully redeemed' using errcode = 'P0001';
  end if;

  -- Already redeemed by this user? Treat as idempotent success.
  if exists (
    select 1 from public.code_redemptions r
    where r.code_id = v_code.id and r.user_id = v_uid
  ) then
    select p.discount_pct into v_partner_discount
    from public.partners p where p.id = v_code.partner_id;
    return query select v_code.id, v_code.partner_id, v_code.package,
      coalesce(v_code.discount_pct, v_partner_discount);
    return;
  end if;

  update public.access_codes
  set uses = uses + 1
  where id = v_code.id;

  insert into public.code_redemptions (code_id, user_id)
  values (v_code.id, v_uid);

  select p.discount_pct into v_partner_discount
  from public.partners p where p.id = v_code.partner_id;

  return query select v_code.id, v_code.partner_id, v_code.package,
    coalesce(v_code.discount_pct, v_partner_discount);
end;
$$;

-- -----------------------------------------------------------------------------
-- subscriptions  (Stripe mirror; writes happen via service role in webhooks)
-- -----------------------------------------------------------------------------
create table public.subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_sub_id      text unique,
  plan               public.subscription_plan,
  status             public.subscription_status not null default 'incomplete',
  current_period_end timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
