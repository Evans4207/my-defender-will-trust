-- =============================================================================
-- Migration 0001 — Extensions, enums, and shared helper functions
-- Build plan §4 (Data Model), §5 (State Engine), §8 (Security).
-- =============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()
create extension if not exists "citext";   -- case-insensitive email

-- -----------------------------------------------------------------------------
-- Enums (kept small + additive; expand via later migrations, never edit in place)
-- -----------------------------------------------------------------------------
create type public.app_role as enum ('user', 'reviewer', 'admin');

create type public.doc_type as enum ('will', 'trust');

create type public.matter_status as enum (
  'in_progress', -- interview underway
  'ready_to_sign', -- documents generated
  'signed' -- user-confirmed execution
);

create type public.person_role as enum (
  'self',
  'spouse',
  'partner',
  'child',
  'stepchild',
  'dependent',
  'executor',
  'alternate_executor',
  'trustee',
  'successor_trustee',
  'guardian',
  'alternate_guardian',
  'beneficiary',
  'agent', -- POA / healthcare agent
  'other'
);

create type public.bequest_type as enum ('percentage', 'specific');

create type public.document_kind as enum (
  'will',
  'trust',
  'pourover',
  'poa',
  'healthcare',
  'hipaa',
  'affidavit'
);

create type public.document_status as enum (
  'draft',
  'generated',
  'delivered',
  'signed'
);

create type public.subscription_plan as enum ('will', 'trust', 'membership');

create type public.subscription_status as enum (
  'incomplete',
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid'
);

-- -----------------------------------------------------------------------------
-- updated_at trigger helper
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Role helpers. SECURITY DEFINER so they read profiles as the table owner and
-- bypass RLS — this avoids infinite recursion when used inside RLS policies.
-- (We never FORCE ROW LEVEL SECURITY, so owner access is unrestricted.)
-- -----------------------------------------------------------------------------
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where user_id = auth.uid()),
    'user'::public.app_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'admin';
$$;

-- Staff = admin or reviewer (reviewer is reserved for the FUTURE review module).
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('admin', 'reviewer');
$$;
