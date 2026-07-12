-- =============================================================================
-- Migration 0005 — Denormalize package + partner onto code_redemptions
-- Lets users read their own entitlement (package) without exposing the
-- admin-only access_codes table, and records partner attribution at redeem
-- time for reporting (§6). Updates redeem_access_code() to populate them.
-- =============================================================================

alter table public.code_redemptions
  add column if not exists package    public.doc_type,
  add column if not exists partner_id uuid references public.partners (id) on delete set null;

create index if not exists code_redemptions_partner_idx
  on public.code_redemptions (partner_id);

-- Recreate the redemption function to also stamp package + partner_id.
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

  select p.discount_pct into v_partner_discount
  from public.partners p where p.id = v_code.partner_id;

  -- Already redeemed by this user? Idempotent success.
  if exists (
    select 1 from public.code_redemptions r
    where r.code_id = v_code.id and r.user_id = v_uid
  ) then
    return query select v_code.id, v_code.partner_id, v_code.package,
      coalesce(v_code.discount_pct, v_partner_discount);
    return;
  end if;

  update public.access_codes
  set uses = uses + 1
  where id = v_code.id;

  insert into public.code_redemptions (code_id, user_id, package, partner_id)
  values (v_code.id, v_uid, v_code.package, v_code.partner_id);

  return query select v_code.id, v_code.partner_id, v_code.package,
    coalesce(v_code.discount_pct, v_partner_discount);
end;
$$;
