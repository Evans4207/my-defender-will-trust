-- =============================================================================
-- Migration 0008 — Private documents storage bucket + template version seeds
-- Phase 3. Files are stored under {user_id}/{matter_id}/... and served ONLY via
-- signed URLs. Direct object access is owner-scoped by these storage policies;
-- downloads are additionally gated by documents-table RLS in the app.
-- =============================================================================

-- Private bucket (no public access).
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Owner-only access to objects in the documents bucket, keyed on the first
-- path segment being the owner's user id.
create policy "documents_owner_select" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "documents_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "documents_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

-- -----------------------------------------------------------------------------
-- Seed template_versions (version 1) for the Will package document kinds.
-- active = false: activation requires attorney approval via the admin workflow
-- (Phase 7). These rows let generation record which template version produced a
-- document. Text lives in the code-based assembler (see src/lib/documents/*),
-- all marked [ATTORNEY REVIEW REQUIRED].
-- -----------------------------------------------------------------------------
insert into public.template_versions (kind, version, name, active, notes)
values
  ('will',       1, 'Will (code template v1)',                 false, '[ATTORNEY REVIEW REQUIRED] pending counsel approval'),
  ('poa',        1, 'Durable Financial POA (code template v1)', false, '[ATTORNEY REVIEW REQUIRED] pending counsel approval'),
  ('healthcare', 1, 'Healthcare Directive (code template v1)',  false, '[ATTORNEY REVIEW REQUIRED] pending counsel approval'),
  ('hipaa',      1, 'HIPAA Authorization (code template v1)',   false, '[ATTORNEY REVIEW REQUIRED] pending counsel approval'),
  ('affidavit',  1, 'Self-Proving Affidavit (code template v1)', false, '[ATTORNEY REVIEW REQUIRED] pending counsel approval')
on conflict (kind, version) do nothing;
