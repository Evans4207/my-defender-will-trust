-- =============================================================================
-- Migration 0013 — Comp vs discount access codes (§3.2)
-- A code's effective discount decides its behavior:
--   100%  -> COMP: redemption grants access directly (bypasses Stripe)
--   <100% -> DISCOUNT: redemption records a pending discount; the user checks
--            out through Stripe at the reduced price (entitlement on payment).
-- code_redemptions now records the effective discount and whether it granted
-- access, so entitlement counts only access-granting (comp) redemptions.
-- =============================================================================

alter table public.code_redemptions
  add column if not exists discount_pct  numeric(5, 2),
  add column if not exists grants_access boolean not null default true;

-- Recreate the redemption function to compute comp vs discount and stamp both.
-- Return type changes (adds grants_access), so drop the old signature first.
drop function if exists public.redeem_access_code(text);
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

  return query select v_code.id, v_code.partner_id, v_code.package, v_effective, v_grants;
end;
$$;
