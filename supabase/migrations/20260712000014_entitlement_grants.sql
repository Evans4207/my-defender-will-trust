-- -----------------------------------------------------------------------------
-- Migration 0014 — entitlement_grants: ownership is permanent, subscription is
-- temporal.
--
-- Before this migration a one-time package purchase was recorded as a row in
-- `subscriptions` with status 'active', and access was resolved by checking that
-- status. That made a permanent purchase depend on a mutable column: any Stripe
-- event, backfill or manual correction that changed status silently removed the
-- customer's access to a document they own outright.
--
-- `entitlement_grants` separates the two ideas:
--   * one-time package purchase -> expires_at IS NULL, never expires
--   * membership                -> expires_at tracks the Stripe period end
--   * revocation                -> a deliberate, recorded act with a reason
--
-- `subscriptions` is unchanged and remains the mirror of Stripe's own state for
-- the billing portal and period-end display. It is no longer the source of
-- truth for access.
-- -----------------------------------------------------------------------------

create type public.grant_source as enum ('purchase', 'code', 'manual');

create table public.entitlement_grants (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  product           public.subscription_plan not null,
  source            public.grant_source not null,
  stripe_session_id text,
  stripe_sub_id     text,
  -- Recorded for one-time purchases so a refund or chargeback webhook, which
  -- carries only the charge and payment intent, can find the grant to revoke.
  stripe_payment_intent text,
  granted_at        timestamptz not null default now(),
  -- NULL means owned outright: no expiry, ever.
  expires_at        timestamptz,
  -- Revocation is deliberate. A refund or chargeback writes both of these.
  revoked_at        timestamptz,
  revoked_reason    text,
  created_at        timestamptz not null default now()
);

create index entitlement_grants_user_id_idx
  on public.entitlement_grants (user_id);

-- One grant per Checkout session — makes webhook redelivery idempotent even if
-- the stripe_events guard is bypassed or reset.
create unique index entitlement_grants_session_idx
  on public.entitlement_grants (stripe_session_id)
  where stripe_session_id is not null;

-- One membership grant per Stripe subscription; the period end updates in place.
create unique index entitlement_grants_sub_idx
  on public.entitlement_grants (stripe_sub_id)
  where stripe_sub_id is not null;

create index entitlement_grants_payment_intent_idx
  on public.entitlement_grants (stripe_payment_intent)
  where stripe_payment_intent is not null;

alter table public.entitlement_grants enable row level security;

-- Owners read their own grants. Only the service role writes them, so there is
-- deliberately no insert/update/delete policy for end users.
create policy entitlement_grants_select on public.entitlement_grants
  for select using (user_id = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- Backfill. Every currently-effective access path becomes a grant so that no
-- existing test-phase user loses access when the new resolver goes live.
-- -----------------------------------------------------------------------------

-- Active subscriptions rows. A row with no stripe_sub_id was a one-time package
-- purchase and becomes permanent; a membership row carries its period end.
insert into public.entitlement_grants
  (user_id, product, source, stripe_sub_id, granted_at, expires_at)
select
  s.user_id,
  s.plan,
  'purchase'::public.grant_source,
  s.stripe_sub_id,
  s.created_at,
  case when s.plan = 'membership' then s.current_period_end else null end
from public.subscriptions s
where s.plan is not null
  and s.status in ('active', 'trialing');

-- Comp code redemptions, which unlocked a package directly rather than through
-- Stripe. package is doc_type ('will' | 'trust'), so cast through text.
insert into public.entitlement_grants
  (user_id, product, source, granted_at, expires_at)
select
  r.user_id,
  r.package::text::public.subscription_plan,
  'code'::public.grant_source,
  r.redeemed_at,
  null
from public.code_redemptions r
where r.package is not null
  and coalesce(r.grants_access, true);

-- -----------------------------------------------------------------------------
-- Comp redemptions must now write a grant, because entitlement is resolved from
-- entitlement_grants and no longer from code_redemptions. Doing it inside the
-- function keeps the redemption and the grant in one transaction.
--
-- Unchanged from migration 0013 apart from the grant insert.
-- -----------------------------------------------------------------------------

create or replace function public.redeem_access_code(p_code text)
returns table (
  code_id       uuid,
  partner_id    uuid,
  package       public.doc_type,
  discount_pct  numeric,
  grants_access boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code public.access_codes%rowtype;
  v_partner_discount numeric;
  v_effective numeric;
  v_grants boolean;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into v_code from public.access_codes where code = p_code for update;
  if not found then raise exception 'invalid code' using errcode = 'P0002'; end if;
  if not v_code.active then raise exception 'code inactive' using errcode = 'P0001'; end if;
  if v_code.expires_at is not null and v_code.expires_at < now() then
    raise exception 'code expired' using errcode = 'P0001';
  end if;
  if v_code.uses >= v_code.max_uses then
    raise exception 'code fully redeemed' using errcode = 'P0001';
  end if;

  select p.discount_pct into v_partner_discount
  from public.partners p where p.id = v_code.partner_id;

  v_effective := coalesce(v_code.discount_pct, v_partner_discount, 0);
  v_grants := v_effective >= 100;

  -- Already redeemed by this user? Idempotent success.
  if exists (
    select 1 from public.code_redemptions r
    where r.code_id = v_code.id and r.user_id = v_uid
  ) then
    return query select v_code.id, v_code.partner_id, v_code.package, v_effective, v_grants;
    return;
  end if;

  update public.access_codes set uses = uses + 1 where id = v_code.id;

  insert into public.code_redemptions (code_id, user_id, package, partner_id, discount_pct, grants_access)
  values (v_code.id, v_uid, v_code.package, v_code.partner_id, v_effective, v_grants);

  -- A comp code is a gift of the product outright: permanent, no expiry. A
  -- discount code grants nothing here — entitlement arrives with the payment.
  if v_grants then
    insert into public.entitlement_grants (user_id, product, source, expires_at)
    values (v_uid, v_code.package::text::public.subscription_plan, 'code', null);
  end if;

  return query select v_code.id, v_code.partner_id, v_code.package, v_effective, v_grants;
end;
$$;
