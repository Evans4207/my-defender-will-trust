-- =============================================================================
-- Migration 0004 — Row-Level Security
-- Build plan §4 ("users see only their own matters/documents; reviewers and
-- admins have role-based elevated access") and §8.
--
-- Model: the `service_role` key bypasses RLS entirely and is used server-side
-- for Stripe webhooks, document generation, and audit writes. These policies
-- govern the anon/authenticated (browser) clients.
-- =============================================================================

-- Enable RLS on every application table.
alter table public.profiles           enable row level security;
alter table public.partners           enable row level security;
alter table public.access_codes       enable row level security;
alter table public.code_redemptions   enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.matters            enable row level security;
alter table public.interview_answers  enable row level security;
alter table public.people             enable row level security;
alter table public.bequests           enable row level security;
alter table public.template_versions  enable row level security;
alter table public.documents          enable row level security;
alter table public.reviews            enable row level security;
alter table public.state_rules        enable row level security;
alter table public.state_availability enable row level security;
alter table public.state_waitlist     enable row level security;
alter table public.audit_log          enable row level security;

-- -----------------------------------------------------------------------------
-- profiles — own row; admins see all. Role changes are guarded by a trigger.
-- -----------------------------------------------------------------------------
create policy profiles_select on public.profiles
  for select using (user_id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Prevent non-admins from escalating their own role.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- -----------------------------------------------------------------------------
-- matters — owner full CRUD; admins all.
-- -----------------------------------------------------------------------------
create policy matters_all on public.matters
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Helper predicate for matter-scoped child tables.
create or replace function public.owns_matter(p_matter_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.matters m
    where m.id = p_matter_id and m.user_id = auth.uid()
  );
$$;

create policy interview_answers_all on public.interview_answers
  for all using (public.owns_matter(matter_id) or public.is_admin())
  with check (public.owns_matter(matter_id) or public.is_admin());

create policy people_all on public.people
  for all using (public.owns_matter(matter_id) or public.is_admin())
  with check (public.owns_matter(matter_id) or public.is_admin());

create policy bequests_all on public.bequests
  for all using (public.owns_matter(matter_id) or public.is_admin())
  with check (public.owns_matter(matter_id) or public.is_admin());

-- -----------------------------------------------------------------------------
-- documents — owner may READ only (downloads via signed URLs). Writes happen
-- server-side via the service role during generation. Admins may read all.
-- -----------------------------------------------------------------------------
create policy documents_select on public.documents
  for select using (public.owns_matter(matter_id) or public.is_admin());

-- -----------------------------------------------------------------------------
-- code_redemptions / subscriptions — own rows readable; writes server-side.
-- -----------------------------------------------------------------------------
create policy code_redemptions_select on public.code_redemptions
  for select using (user_id = auth.uid() or public.is_admin());

create policy subscriptions_select on public.subscriptions
  for select using (user_id = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- partners / access_codes — admin only. Redemption is via redeem_access_code().
-- -----------------------------------------------------------------------------
create policy partners_admin_all on public.partners
  for all using (public.is_admin()) with check (public.is_admin());

create policy access_codes_admin_all on public.access_codes
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- template_versions — staff read; admin manage.
-- -----------------------------------------------------------------------------
create policy template_versions_staff_read on public.template_versions
  for select using (public.is_staff());
create policy template_versions_admin_all on public.template_versions
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- reviews — FUTURE MODULE, staff only.
-- -----------------------------------------------------------------------------
create policy reviews_staff_all on public.reviews
  for all using (public.is_staff()) with check (public.is_staff());

-- -----------------------------------------------------------------------------
-- state_rules / state_availability — public READ (drives the interview);
-- admin write.
-- -----------------------------------------------------------------------------
create policy state_rules_public_read on public.state_rules
  for select using (true);
create policy state_rules_admin_all on public.state_rules
  for all using (public.is_admin()) with check (public.is_admin());

create policy state_availability_public_read on public.state_availability
  for select using (true);
create policy state_availability_admin_all on public.state_availability
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- state_waitlist — anyone may join a waitlist; admin reads.
-- -----------------------------------------------------------------------------
create policy state_waitlist_insert on public.state_waitlist
  for insert with check (true);
create policy state_waitlist_admin_read on public.state_waitlist
  for select using (public.is_admin());

-- -----------------------------------------------------------------------------
-- audit_log — admin read; inserts happen via service role only.
-- -----------------------------------------------------------------------------
create policy audit_log_admin_read on public.audit_log
  for select using (public.is_admin());
