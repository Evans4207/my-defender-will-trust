-- =============================================================================
-- Migration 0003 — Matters, interview data, documents, templates, state engine
-- Build plan §3.3 (interview), §4 (data model), §5 (50-state engine).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- matters — one estate-planning "matter" per user per document track
-- -----------------------------------------------------------------------------
create table public.matters (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  doc_type   public.doc_type not null,
  state      text, -- 2-letter code, set at the state-selection step
  status     public.matter_status not null default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index matters_user_id_idx on public.matters (user_id);
create trigger matters_set_updated_at
  before update on public.matters
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- interview_answers — autosave target; one row per (matter, step)
-- -----------------------------------------------------------------------------
create table public.interview_answers (
  id           uuid primary key default gen_random_uuid(),
  matter_id    uuid not null references public.matters (id) on delete cascade,
  step_key     text not null,
  answers_jsonb jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now(),
  unique (matter_id, step_key)
);

create index interview_answers_matter_id_idx on public.interview_answers (matter_id);
create trigger interview_answers_set_updated_at
  before update on public.interview_answers
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- people — spouses, children, fiduciaries, beneficiaries, agents
-- -----------------------------------------------------------------------------
create table public.people (
  id            uuid primary key default gen_random_uuid(),
  matter_id     uuid not null references public.matters (id) on delete cascade,
  role          public.person_role not null,
  name          text not null,
  relationship  text,
  contact       text,
  metadata_jsonb jsonb not null default '{}'::jsonb, -- DOB, minor flag, per-stirpes issue, etc.
  created_at    timestamptz not null default now()
);

create index people_matter_id_idx on public.people (matter_id);

-- -----------------------------------------------------------------------------
-- bequests — distributions tied to a beneficiary person
-- -----------------------------------------------------------------------------
create table public.bequests (
  id                   uuid primary key default gen_random_uuid(),
  matter_id            uuid not null references public.matters (id) on delete cascade,
  beneficiary_person_id uuid references public.people (id) on delete set null,
  type                 public.bequest_type not null,
  value                text, -- percentage (e.g. "50") or specific-item description
  contingency          text, -- plain-English contingent instruction
  created_at           timestamptz not null default now()
);

create index bequests_matter_id_idx on public.bequests (matter_id);

-- -----------------------------------------------------------------------------
-- template_versions — every template is versioned + attorney-approved (§5)
-- A template may only be activated once approved_by/approved_at are set.
-- -----------------------------------------------------------------------------
create table public.template_versions (
  id           uuid primary key default gen_random_uuid(),
  kind         public.document_kind not null,
  version      integer not null,
  name         text not null,
  storage_path text, -- DOCX master template in Supabase Storage
  checksum     text,
  approved_by  uuid references auth.users (id),
  approved_at  timestamptz,
  active       boolean not null default false,
  notes        text,
  created_at   timestamptz not null default now(),
  unique (kind, version),
  -- Cannot be active unless approved.
  constraint active_requires_approval
    check (active = false or (approved_by is not null and approved_at is not null))
);

-- -----------------------------------------------------------------------------
-- documents — generated output files
-- -----------------------------------------------------------------------------
create table public.documents (
  id                  uuid primary key default gen_random_uuid(),
  matter_id           uuid not null references public.matters (id) on delete cascade,
  kind                public.document_kind not null,
  version             integer not null default 1,
  template_version_id uuid references public.template_versions (id),
  storage_path        text, -- private bucket; served via signed URLs only
  status              public.document_status not null default 'draft',
  generated_at        timestamptz
);

create index documents_matter_id_idx on public.documents (matter_id);

-- -----------------------------------------------------------------------------
-- reviews — FUTURE MODULE. Schema reserved for the optional in-house attorney
-- review offering (§4, §7). DO NOT BUILD reviewer UI at launch. Present only so
-- the status model / feature flag can be added later without a migration.
-- -----------------------------------------------------------------------------
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  matter_id   uuid not null references public.matters (id) on delete cascade,
  reviewer_id uuid references auth.users (id),
  status      text not null default 'not_requested',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.reviews is
  'FUTURE MODULE — reserved. Not used at launch. See build plan §7.';

-- -----------------------------------------------------------------------------
-- state_rules — the data-driven 50-state legal engine (§5)
-- No legal rules hardcoded in templates/code; everything lives here.
-- doc_type NULL means the rule applies to both wills and trusts.
-- needs_review flags anything ambiguous for human/counsel review.
-- -----------------------------------------------------------------------------
create table public.state_rules (
  id             uuid primary key default gen_random_uuid(),
  state_code     text not null, -- 2-letter USPS code, or 'DC'
  doc_type       public.doc_type, -- null => applies to both
  rule_key       text not null,
  rule_value     jsonb not null,
  citation       text, -- statute cite recorded at build time (Instructions #4)
  checked_at     date, -- date the citation was verified
  effective_date date,
  needs_review   boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Unique per (state, rule, doc_type) treating NULL doc_type as '*'.
create unique index state_rules_unique_idx
  on public.state_rules (state_code, rule_key, coalesce(doc_type::text, '*'));
create index state_rules_state_idx on public.state_rules (state_code);
create trigger state_rules_set_updated_at
  before update on public.state_rules
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- state_availability — per-state launch toggle (§5.4). Excluded states show a
-- "Not yet available" waitlist screen. Enabling a state is a config change,
-- NOT a code deploy.
-- -----------------------------------------------------------------------------
create table public.state_availability (
  state_code text primary key, -- 2-letter code or 'DC'
  available  boolean not null default false,
  reason     text, -- why excluded (e.g. UPL enforcement history, civil-law)
  updated_at timestamptz not null default now()
);

create trigger state_availability_set_updated_at
  before update on public.state_availability
  for each row execute function public.set_updated_at();

-- Waitlist capture for excluded states.
create table public.state_waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      citext not null,
  state_code text not null,
  user_id    uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index state_waitlist_state_idx on public.state_waitlist (state_code);

-- -----------------------------------------------------------------------------
-- audit_log — append-only record of document access + admin actions (§8)
-- -----------------------------------------------------------------------------
create table public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete set null,
  action     text not null,
  entity     text,
  entity_id  uuid,
  ip         inet,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_user_id_idx on public.audit_log (user_id);
create index audit_log_entity_idx on public.audit_log (entity, entity_id);
