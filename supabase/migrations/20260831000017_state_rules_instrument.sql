-- =============================================================================
-- Migration 0017 — separate "which instrument" from "which package was sold"
--
-- WHY
-- ---
-- `public.doc_type` is an enum of exactly ('will', 'trust') and it does double
-- duty. In eleven places it means WHICH PACKAGE WAS SOLD — partners.default_package,
-- subscriptions.package, codes.package, code_redemptions.package,
-- entitlement_grants.package, matters.doc_type, and the redeem_access_code()
-- return type. In exactly one place, state_rules.doc_type, it means WHICH
-- INSTRUMENT THIS RULE GOVERNS.
--
-- Those are different things, and conflating them has two consequences.
--
-- 1. There is nowhere to put the research. Execution formalities for the trust,
--    the durable financial POA and the healthcare directive are not recorded for
--    any state — every seeded row is doc_type = 'will'. They cannot be added,
--    because adding 'poa' to public.doc_type would make matters, subscriptions
--    and entitlement_grants accept a value that is not a sellable product.
--
-- 2. A trust customer's pour-over will is built from no will research at all.
--    getStateRuleset() asks for rules matching the PACKAGE ('trust'), the seed
--    has no doc_type='trust' rows, so the query returns only the two rows with a
--    NULL doc_type. For a Florida trust customer that means:
--        selfProvingAffidavit.available = false  (so NO affidavit is generated)
--        signatureAtEndRequired        = false  (Florida requires signature at the end)
--        witnessesRequired             = 2      (a code fallback, not Florida data)
--    A pour-over will IS a will. Its formalities come from will rules, whatever
--    package was sold.
--
-- 3. The NULL trap. Migration 0003 line 131 declares that a NULL doc_type means
--    the rule applies to BOTH wills and trusts, and
--    notarization_required_for_document is seeded NULL for all 51 states — while
--    the citation on every one of those rows reads "Attested will valid without
--    notarization." That is will research wearing a trust label, and it reads as
--    authoritative. Worse than absent data.
--
-- WHAT THIS DOES
-- --------------
-- state_rules gets its own type. public.doc_type is left exactly as it is and
-- keeps its "which package was sold" meaning everywhere else — no enum surgery
-- on the billing side.
--
-- The NULL-means-both semantics are removed. NULL now means one thing only: a
-- fact about the STATE that is not tied to any instrument (community property).
-- A CHECK constraint enforces it, so a formality can never again pose as
-- "applies to both". New rule keys must name their instrument; that is
-- deliberate, and it fails closed.
-- =============================================================================

create type public.instrument_type as enum (
  'will',
  'pourover',
  'trust',
  'poa',
  'healthcare',
  'hipaa'
);

comment on type public.instrument_type is
  'Which legal instrument a state_rules row governs. NOT the same as public.doc_type, which is the package that was sold. A self-proving affidavit is not listed: it is part of the will''s execution, not a separate instrument.';

alter table public.state_rules
  add column if not exists instrument public.instrument_type;

-- Rows that already named an instrument keep it. Both enum labels exist in the
-- new type, so this is a straight relabel.
update public.state_rules
   set instrument = doc_type::text::public.instrument_type
 where doc_type is not null;

-- The trap, resolved. These rows were seeded with a NULL doc_type ("applies to
-- both") but every one of them cites will law. They are will rules and always
-- were. needs_review is deliberately left as it is — this records what the row
-- has always said, it does not clear it for launch.
update public.state_rules
   set instrument = 'will'
 where doc_type is null
   and rule_key = 'notarization_required_for_document';

-- Anything still NULL must be a genuine state-level fact. If a live database
-- carries a NULL row for some other key, stop and say which — silently letting
-- it through is how the trust label got attached to will research in the first
-- place.
do $$
declare
  offenders text;
begin
  select string_agg(distinct state_code || '/' || rule_key, ', ')
    into offenders
    from public.state_rules
   where instrument is null
     and rule_key not in ('community_property');

  if offenders is not null then
    raise exception
      'state_rules has NULL-instrument rows for instrument-scoped keys: %. Assign each an instrument before re-running this migration.',
      offenders;
  end if;
end $$;

drop index if exists public.state_rules_unique_idx;

alter table public.state_rules drop column doc_type;

-- Unique per (state, rule, instrument), treating NULL instrument as a real value
-- so two state-level rows for the same state+key collide. Requires PG15+.
create unique index state_rules_unique_idx
  on public.state_rules (state_code, rule_key, instrument) nulls not distinct;

create index if not exists state_rules_instrument_idx
  on public.state_rules (instrument);

-- NULL is permitted only for keys that are facts about the state rather than
-- about an instrument. Every other key must name its instrument. Adding a new
-- state-level key means editing this list on purpose.
alter table public.state_rules
  add constraint state_rules_instrument_scope_chk check (
    case
      when rule_key in ('community_property') then instrument is null
      else instrument is not null
    end
  );

comment on column public.state_rules.instrument is
  'Which instrument this rule governs. NULL means the rule is a fact about the state itself and is not tied to an instrument (see state_rules_instrument_scope_chk). NULL does NOT mean "applies to every instrument" — that meaning was removed in migration 0017.';

comment on table public.state_rules is
  'The data-driven 51-jurisdiction legal engine (build plan §5). No legal rules hardcoded in templates or code. Scoped by `instrument`, NOT by the package that was sold: a pour-over will is a will and takes will rules. needs_review flags anything awaiting counsel.';
