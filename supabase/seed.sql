-- =============================================================================
-- Seed — state execution-formality basics for the 5 pilot states (Phase 0).
-- Pilot states: TX, CA, FL, NV, AZ  (build plan Phase 0 acceptance).
--
-- ⚠️ [ATTORNEY REVIEW REQUIRED]
-- These rules were compiled from primary statutes via web research on the date
-- recorded in `checked_at`, per "Instructions to the Coding Model" #4. They are
-- PLACEHOLDER legal data for engineering the rules layer — NOT verified legal
-- advice. Every ambiguous item is flagged `needs_review = true`. Counsel must
-- review before any state toggles live.
--
-- Idempotent: safe to run repeatedly (ON CONFLICT upserts).
--
-- Citations (verified 2026-07-12):
--   TX  Estates Code §251.051 (attested), §251.101–.104 (self-proved)
--   CA  Probate Code §6110 (execution), §8220 (proof of will)
--   FL  Fla. Stat. §732.502 (execution), §732.503 (self-proof), §732.521+ (e-will)
--   NV  NRS §133.040 (execution), §133.050 (self-proving), §133.085 (e-will)
--   AZ  ARS §14-2502 (execution), §14-2504 (self-proved), §14-2518 (e-will)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- state_rules
-- doc_type NULL => rule applies to both wills and trusts.
-- -----------------------------------------------------------------------------
insert into public.state_rules
  (state_code, doc_type, rule_key, rule_value, citation, checked_at, needs_review)
values
  -- ===== Texas =====
  ('TX', 'will', 'witnesses_required', '{"count": 2}', 'Tex. Est. Code §251.051', '2026-07-12', false),
  ('TX', 'will', 'witness_min_age', '{"age": 14}', 'Tex. Est. Code §251.051', '2026-07-12', false),
  ('TX', null, 'notarization_required_for_document', '{"required": false, "note": "Attested will valid without notarization; notary needed only for self-proving affidavit."}', 'Tex. Est. Code §251.051, §251.104', '2026-07-12', false),
  ('TX', 'will', 'self_proving_affidavit', '{"available": true, "requires_notary": true}', 'Tex. Est. Code §251.101–§251.104', '2026-07-12', false),
  ('TX', 'will', 'electronic_will_permitted', '{"permitted": false, "mvp_position": "wet_signature"}', 'No general Texas e-will statute as of 2026-07-12', '2026-07-12', true),
  ('TX', null, 'community_property', '{"community_property": true}', 'Build plan §5.2', '2026-07-12', false),

  -- ===== California =====
  ('CA', 'will', 'witnesses_required', '{"count": 2}', 'Cal. Prob. Code §6110(c)(1)', '2026-07-12', false),
  ('CA', 'will', 'witness_min_age', '{"age": null, "note": "No fixed statutory age; witness must be competent (§6112)."}', 'Cal. Prob. Code §6112', '2026-07-12', true),
  ('CA', null, 'notarization_required_for_document', '{"required": false, "note": "CA will need not be notarized; notarization does NOT substitute for witnesses."}', 'Cal. Prob. Code §6110', '2026-07-12', false),
  ('CA', 'will', 'self_proving_affidavit', '{"available": "uncertain", "note": "California lacks a classic self-proving affidavit; proof of will governed by §8220. Confirm approach with counsel."}', 'Cal. Prob. Code §8220', '2026-07-12', true),
  ('CA', 'will', 'electronic_will_permitted', '{"permitted": false, "mvp_position": "wet_signature"}', 'No California e-will statute as of 2026-07-12', '2026-07-12', true),
  ('CA', null, 'community_property', '{"community_property": true}', 'Build plan §5.2', '2026-07-12', false),

  -- ===== Florida =====
  ('FL', 'will', 'witnesses_required', '{"count": 2}', 'Fla. Stat. §732.502(1)(b)', '2026-07-12', false),
  ('FL', 'will', 'witness_min_age', '{"age": null, "note": "Any competent person; no fixed statutory age."}', 'Fla. Stat. §732.502', '2026-07-12', true),
  ('FL', 'will', 'signature_at_end_required', '{"required": true}', 'Fla. Stat. §732.502(1)(a)', '2026-07-12', false),
  ('FL', null, 'notarization_required_for_document', '{"required": false, "note": "Attested will valid without notary; self-proving affidavit requires a notary."}', 'Fla. Stat. §732.502, §732.503', '2026-07-12', false),
  ('FL', 'will', 'self_proving_affidavit', '{"available": true, "requires_notary": true}', 'Fla. Stat. §732.503', '2026-07-12', false),
  ('FL', 'will', 'electronic_will_permitted', '{"permitted": true, "mvp_position": "wet_signature", "note": "FL electronic wills exist (§732.521+, remote online notarization) but MVP uses wet signatures."}', 'Fla. Stat. §732.521–§732.525', '2026-07-12', true),
  ('FL', null, 'community_property', '{"community_property": false}', 'Common-law (separate property) state', '2026-07-12', false),

  -- ===== Nevada =====
  ('NV', 'will', 'witnesses_required', '{"count": 2}', 'NRS §133.040', '2026-07-12', false),
  ('NV', 'will', 'witness_min_age', '{"age": null, "note": "Two competent witnesses; no fixed statutory age."}', 'NRS §133.040', '2026-07-12', true),
  ('NV', null, 'notarization_required_for_document', '{"required": false}', 'NRS §133.040', '2026-07-12', false),
  ('NV', 'will', 'self_proving_affidavit', '{"available": true, "requires_notary": false, "note": "Witness may sign a declaration under penalty of perjury OR an affidavit before a notary."}', 'NRS §133.050', '2026-07-12', false),
  ('NV', 'will', 'electronic_will_permitted', '{"permitted": true, "mvp_position": "wet_signature"}', 'NRS §133.085', '2026-07-12', true),
  ('NV', null, 'community_property', '{"community_property": true}', 'Build plan §5.2', '2026-07-12', false),

  -- ===== Arizona =====
  ('AZ', 'will', 'witnesses_required', '{"count": 2}', 'ARS §14-2502', '2026-07-12', false),
  ('AZ', 'will', 'witness_min_age', '{"age": null, "note": "Two competent witnesses; witnessing may be in person or by audio-video."}', 'ARS §14-2502', '2026-07-12', true),
  ('AZ', null, 'notarization_required_for_document', '{"required": false}', 'ARS §14-2502', '2026-07-12', false),
  ('AZ', 'will', 'self_proving_affidavit', '{"available": true, "requires_notary": true}', 'ARS §14-2504', '2026-07-12', false),
  ('AZ', 'will', 'electronic_will_permitted', '{"permitted": true, "mvp_position": "wet_signature"}', 'ARS §14-2518', '2026-07-12', true),
  ('AZ', null, 'community_property', '{"community_property": true}', 'Build plan §5.2', '2026-07-12', false)
on conflict (state_code, rule_key, coalesce(doc_type::text, '*'))
do update set
  rule_value   = excluded.rule_value,
  citation     = excluded.citation,
  checked_at   = excluded.checked_at,
  needs_review = excluded.needs_review,
  updated_at   = now();

-- -----------------------------------------------------------------------------
-- state_availability (§5.4)
-- Pilot states CA/FL/NV/AZ are available. TX rules are seeded for QA but TX is
-- EXCLUDED at launch (UPL review). LA/NC/MO/OH excluded. Any state without a
-- row here is treated as unavailable by the app.
-- -----------------------------------------------------------------------------
insert into public.state_availability (state_code, available, reason)
values
  ('CA', true,  null),
  ('FL', true,  null),
  ('NV', true,  null),
  ('AZ', true,  null),
  ('TX', false, 'Excluded pending counsel review (UPL enforcement history). Rules seeded for QA only.'),
  ('LA', false, 'Excluded: civil-law jurisdiction, forced heirship, distinct will forms.'),
  ('NC', false, 'Excluded pending counsel review (UPL enforcement history).'),
  ('MO', false, 'Excluded pending counsel review (UPL enforcement history).'),
  ('OH', false, 'Excluded pending counsel review (UPL enforcement history).')
on conflict (state_code)
do update set
  available  = excluded.available,
  reason     = excluded.reason,
  updated_at = now();
