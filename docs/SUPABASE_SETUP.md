# Supabase setup (Phase 0 completion)

The app is code-complete but needs a hosted Supabase project to satisfy the rest
of the Phase 0 acceptance checklist (auth works / migrations run / seed loads).
Follow these steps once; it takes ~10 minutes.

## 1. Create the project
1. Go to <https://supabase.com> → sign up (free tier is fine).
2. **New project** → name it `my-defender-will-trust` (or similar).
3. Pick a strong database password and **save it** — you'll need it below.
4. Choose a region close to you. Wait ~2 min for provisioning.

## 2. Grab your keys
Project Settings → **API**:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key (secret) → `SUPABASE_SERVICE_ROLE_KEY`

Project Settings → **Database** → Connection string (URI) → `SUPABASE_DB_URL`
(replace `[YOUR-PASSWORD]` with the DB password from step 1).

Put these into `.env.local` (copy from `.env.example`). Replace the placeholders.

## 3. Install the Supabase CLI
```bash
brew install supabase/tap/supabase   # macOS
```

## 4. Link and apply the schema
```bash
cd ~/my-defender-will-trust
supabase login                 # opens browser
supabase link --project-ref <your-project-ref>   # ref is in the dashboard URL
npm run db:push                # applies supabase/migrations/*
npm run db:seed                # loads supabase/seed.sql (pilot state rules)
```

`db:seed` needs `psql`. If you don't have it: `brew install libpq` then
`brew link --force libpq` (or run the seed from the Supabase SQL editor by pasting
`supabase/seed.sql`).

## 5. Regenerate typed database types
```bash
npm run db:types               # overwrites src/lib/supabase/types.ts
```

## 6. Verify
```bash
npm run dev
```
Open <http://localhost:3000>. The site should load with no console errors, and
the Supabase tables (profiles, state_rules, etc.) should be visible in the
dashboard Table editor with the pilot-state rows seeded.

## Auth email settings (for Phase 1)
Authentication → Providers → Email is on by default. For local testing, magic
links / confirmation emails appear in the Supabase **Auth logs**; production
email delivery is wired up in Phase 3 (Resend/Postmark).

---
Once this is done, tell Claude "Supabase is live" and Phase 0 acceptance can be
verified end-to-end, then Phase 1 can begin.
