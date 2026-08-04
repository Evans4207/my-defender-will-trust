-- =============================================================================
-- Migration 15 — Household model (couples, two real accounts).
--
-- docs/HOUSEHOLD_WORK_ORDER.md §1. STRICTLY ADDITIVE: no existing column, policy
-- or row is dropped or rewritten, so the individual flow is untouched and this is
-- safe to apply to the hosted project that Donovan is testing against.
--
-- A household links two auth accounts (member 'a' = the buyer, member 'b' = the
-- invited spouse/partner). Each spouse OWNS their own document set; the joint
-- trust is shared (scope = 'household'). Immutability of the other member's set
-- is a SCHEMA property: there is no user-facing write policy on documents at all,
-- so no member can ever update or delete another member's documents.
--
-- Apply with the single-migration script (NEVER db-apply.mjs on hosted):
--   node scripts/apply-migration-15.mjs
-- Then: npm run db:types
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------
create table if not exists public.households (
  id         uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- role 'a' = creator/buyer, 'b' = invited partner. unique(household_id, role)
-- caps membership at two (one 'a', one 'b'); unique(household_id, user_id) stops
-- the same person joining twice.
create table if not exists public.household_members (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         text not null check (role in ('a', 'b')),
  joined_at    timestamptz not null default now(),
  unique (household_id, user_id),
  unique (household_id, role)
);

create index if not exists household_members_user_id_idx
  on public.household_members (user_id);
create index if not exists household_members_household_id_idx
  on public.household_members (household_id);

-- Invites store a HASH of the token, never the token itself (same discipline as
-- access codes). The raw token lives only in the emailed / copied link.
create table if not exists public.household_invites (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  email        text not null,
  token_hash   text not null,
  invited_by   uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  revoked_at   timestamptz
);

create index if not exists household_invites_household_id_idx
  on public.household_invites (household_id);
create unique index if not exists household_invites_token_hash_idx
  on public.household_invites (token_hash);

-- ---------------------------------------------------------------------------
-- 2. Extend documents + matters (additive columns)
--    owner_user_id makes ownership explicit rather than inferred through the
--    matter; scope distinguishes a member's private set from the shared joint
--    trust. matters.household_id ties a matter to its household.
-- ---------------------------------------------------------------------------
alter table public.documents
  add column if not exists owner_user_id uuid references auth.users (id) on delete set null;
alter table public.documents
  add column if not exists scope text not null default 'private'
    check (scope in ('private', 'household'));

-- Backfill ownership for every existing document from its matter's owner.
update public.documents d
   set owner_user_id = m.user_id
  from public.matters m
 where m.id = d.matter_id
   and d.owner_user_id is null;

create index if not exists documents_owner_user_id_idx
  on public.documents (owner_user_id);

alter table public.matters
  add column if not exists household_id uuid references public.households (id) on delete set null;

create index if not exists matters_household_id_idx
  on public.matters (household_id);

-- ---------------------------------------------------------------------------
-- 3. security definer helpers — the RLS pattern already used in this repo
--    (see current_app_role / is_admin, migration 1). SECURITY DEFINER so they
--    read household_members / matters as the table owner and bypass RLS; without
--    that, member B could not "see" member A's matter row to authorise reading
--    the shared joint trust. NEVER a service-role read from application code —
--    these run inside RLS policies only.
-- ---------------------------------------------------------------------------
create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.household_members hm
     where hm.household_id = p_household_id
       and hm.user_id = auth.uid()
  );
$$;

-- True when the current user shares a household with the document's matter — used
-- to authorise reads of the shared (scope = 'household') documents. Reads matters
-- + household_members under definer rights so the other member's matter, hidden
-- from them by matters' own RLS, is still resolvable here.
create or replace function public.can_read_household_document(p_matter_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.matters m
      join public.household_members hm on hm.household_id = m.household_id
     where m.id = p_matter_id
       and m.household_id is not null
       and hm.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. RLS
--    New tables: reads for members (writes happen server-side via the service
--    role in the invite/accept flow — same split as the rest of the app).
--    documents: an ADDITIVE second SELECT policy for the shared joint trust.
--    Postgres OR-combines permissive policies, so the existing owner/admin read
--    (documents_select) is untouched and each member keeps reading their own set.
--    No INSERT/UPDATE/DELETE policy is added for any of these tables, so a member
--    can never write another member's row — immutability by schema, not courtesy.
-- ---------------------------------------------------------------------------
alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;

create policy households_select on public.households
  for select using (
    created_by = auth.uid()
    or public.is_household_member(id)
    or public.is_admin()
  );

create policy household_members_select on public.household_members
  for select using (
    public.is_household_member(household_id)
    or public.is_admin()
  );

create policy household_invites_select on public.household_invites
  for select using (
    invited_by = auth.uid()
    or public.is_household_member(household_id)
    or public.is_admin()
  );

create policy documents_household_select on public.documents
  for select using (
    scope = 'household'
    and public.can_read_household_document(matter_id)
  );

commit;
