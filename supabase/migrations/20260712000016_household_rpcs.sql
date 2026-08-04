-- =============================================================================
-- Migration 16 — Household flow RPCs (create / invite / revoke / accept).
--
-- docs/HOUSEHOLD_WORK_ORDER.md §2. All household writes go through SECURITY
-- DEFINER functions — the same pattern as public.redeem_access_code — NOT the
-- service role (which the access rules reserve for webhooks and admin writes).
-- The functions run with owner rights so they can write rows the caller could
-- not reach under RLS (e.g. member B inserting their own membership, or reading
-- member A's grants to mirror them), while still authorising every step against
-- auth.uid() and a secret invite token.
--
-- Additive; depends on migration 15. Apply on hosted with:
--   node scripts/apply-migration-16.mjs
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- create_household — the buyer (member 'a') starts a household. Idempotent: if
-- the caller already belongs to one, returns it rather than creating a second.
-- ---------------------------------------------------------------------------
create or replace function public.create_household()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_household uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select hm.household_id into v_household
    from public.household_members hm
   where hm.user_id = v_uid
   limit 1;
  if v_household is not null then
    return v_household;
  end if;

  insert into public.households (created_by) values (v_uid)
    returning id into v_household;
  insert into public.household_members (household_id, user_id, role)
    values (v_household, v_uid, 'a');

  return v_household;
end;
$$;

-- ---------------------------------------------------------------------------
-- issue_household_invite — a member creates (or re-issues) the invite for their
-- household. Any prior open invite is revoked first, so only one link is ever
-- live. The caller supplies the token HASH; the raw token never touches the DB.
-- ---------------------------------------------------------------------------
create or replace function public.issue_household_invite(
  p_email      text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_household uuid;
  v_invite uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select hm.household_id into v_household
    from public.household_members hm
   where hm.user_id = v_uid and hm.role = 'a'
   limit 1;
  if v_household is null then
    raise exception 'not_household_owner';
  end if;

  -- Only one live invite at a time — supersede any prior open one.
  update public.household_invites
     set revoked_at = now()
   where household_id = v_household
     and accepted_at is null
     and revoked_at is null;

  insert into public.household_invites
    (household_id, email, token_hash, invited_by, expires_at)
  values
    (v_household, p_email, p_token_hash, v_uid, p_expires_at)
  returning id into v_invite;

  return v_invite;
end;
$$;

-- ---------------------------------------------------------------------------
-- revoke_household_invite — member 'a' cancels an outstanding invite.
-- ---------------------------------------------------------------------------
create or replace function public.revoke_household_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  update public.household_invites hi
     set revoked_at = now()
   where hi.id = p_invite_id
     and hi.accepted_at is null
     and exists (
       select 1 from public.household_members hm
        where hm.household_id = hi.household_id
          and hm.user_id = v_uid
          and hm.role = 'a'
     );
end;
$$;

-- ---------------------------------------------------------------------------
-- accept_household_invite — partner B, freshly signed up, redeems the token.
-- Adds B as member 'b', mirrors member A's permanent will/trust grants to B as
-- independent permanent grants (source 'code'), and consumes the invite. Every
-- guard raises a distinct message the server action maps to friendly copy.
-- Idempotent for B re-hitting an already-accepted-by-them link.
-- ---------------------------------------------------------------------------
create or replace function public.accept_household_invite(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_invite record;
  v_creator uuid;
  v_existing uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_invite
    from public.household_invites
   where token_hash = p_token_hash
   limit 1;
  if not found then
    raise exception 'invite_not_found';
  end if;
  if v_invite.revoked_at is not null then
    raise exception 'invite_revoked';
  end if;
  if v_invite.expires_at <= now() then
    raise exception 'invite_expired';
  end if;

  select created_by into v_creator from public.households where id = v_invite.household_id;
  if v_creator = v_uid then
    raise exception 'cannot_accept_own';
  end if;

  -- Which household (if any) does the caller already belong to?
  select hm.household_id into v_existing
    from public.household_members hm
   where hm.user_id = v_uid
   limit 1;

  if v_existing = v_invite.household_id then
    -- Already this household's member B — just make sure the invite is consumed.
    update public.household_invites set accepted_at = coalesce(accepted_at, now())
      where id = v_invite.id;
    return v_invite.household_id;
  elsif v_existing is not null then
    raise exception 'already_in_household';
  end if;

  if v_invite.accepted_at is not null then
    raise exception 'invite_already_used';
  end if;

  insert into public.household_members (household_id, user_id, role)
    values (v_invite.household_id, v_uid, 'b');

  -- Mirror member A's permanent package grants (will/trust) to B — independent
  -- rows, so neither grant depends on the other. Skip products B already owns.
  insert into public.entitlement_grants (user_id, product, source, expires_at)
    select v_uid, g.product, 'code'::public.grant_source, null
      from public.entitlement_grants g
     where g.user_id = v_creator
       and g.revoked_at is null
       and g.expires_at is null
       and g.product in ('will'::public.subscription_plan, 'trust'::public.subscription_plan)
       and not exists (
         select 1 from public.entitlement_grants e2
          where e2.user_id = v_uid
            and e2.product = g.product
            and e2.revoked_at is null
       );

  update public.household_invites set accepted_at = now() where id = v_invite.id;

  return v_invite.household_id;
end;
$$;

-- EXECUTE defaults to PUBLIC for new functions, but grant explicitly so a
-- one-migration-at-a-time apply matches db-apply.mjs's global grants.
grant execute on function
  public.create_household(),
  public.issue_household_invite(text, text, timestamptz),
  public.revoke_household_invite(uuid),
  public.accept_household_invite(text)
  to anon, authenticated, service_role;

commit;
