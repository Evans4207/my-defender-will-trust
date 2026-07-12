-- =============================================================================
-- Migration 0011 — Per-state QA sign-off tracking (Phase 6)
-- The build plan requires a per-state QA checklist (execution formalities,
-- statutory forms, community-property language) to be signed off before a state
-- goes live. `available` controls access; `qa_approved` records counsel/QA
-- clearance so the two can be managed independently (owner opted to enable
-- broadly now and let counsel clear states over time — a config change).
-- =============================================================================

alter table public.state_availability
  add column if not exists qa_approved boolean not null default false,
  add column if not exists qa_notes    text;
