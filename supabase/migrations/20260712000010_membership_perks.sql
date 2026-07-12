-- =============================================================================
-- Migration 0010 — Membership perks (§12, Phase 4)
-- Secure document vault, trust funding tracker, annual estate checkup pointer.
-- =============================================================================

-- --- Secure document vault ---------------------------------------------------
-- Files live in the private 'documents' bucket under {user_id}/vault/... and are
-- served only via signed URLs. This table is the browsable index.
create table public.vault_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  storage_path text not null,
  content_type text,
  size_bytes   bigint,
  created_at   timestamptz not null default now()
);

create index vault_items_user_idx on public.vault_items (user_id);
alter table public.vault_items enable row level security;

create policy vault_items_owner_all on public.vault_items
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- --- Trust funding tracker ---------------------------------------------------
-- Checklist of assets to retitle into a trust; trusts fail when unfunded.
create table public.funding_items (
  id          uuid primary key default gen_random_uuid(),
  matter_id   uuid not null references public.matters (id) on delete cascade,
  asset_label text not null,
  category    text, -- real_estate | account | vehicle | business | other
  retitled    boolean not null default false,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index funding_items_matter_idx on public.funding_items (matter_id);
create trigger funding_items_set_updated_at
  before update on public.funding_items
  for each row execute function public.set_updated_at();

alter table public.funding_items enable row level security;

create policy funding_items_owner_all on public.funding_items
  for all using (public.owns_matter(matter_id) or public.is_admin())
  with check (public.owns_matter(matter_id) or public.is_admin());

-- --- Annual estate checkup pointer -------------------------------------------
alter table public.profiles
  add column if not exists last_checkup_at  timestamptz,
  add column if not exists next_checkup_due date;
