// Resets the public schema, applies all migrations in order, loads the seed, and
// re-grants role privileges — all in one transaction, so it is fully re-runnable.
// Reads SUPABASE_DB_URL from the environment or .env.local.
// Usage: node scripts/db-apply.mjs
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function readEnvLocal() {
  try {
    const text = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*SUPABASE_DB_URL\s*=\s*"?([^"\n]+)"?\s*$/);
      if (m) return m[1];
    }
  } catch {}
  return null;
}

const dbUrl = process.env.SUPABASE_DB_URL || readEnvLocal();
if (!dbUrl || dbUrl.includes("localhost") || dbUrl.includes("[PASSWORD]")) {
  console.error("SUPABASE_DB_URL is not set to a real database. Fill it in .env.local first.");
  process.exit(1);
}

const RESET = `
drop policy if exists "documents_owner_select" on storage.objects;
drop policy if exists "documents_owner_insert" on storage.objects;
drop policy if exists "documents_owner_delete" on storage.objects;
drop trigger if exists on_auth_user_created on auth.users;
drop schema if exists public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
`;

const GRANTS = `
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
notify pgrst, 'reload schema';
`;

const migrationsDir = join(root, "supabase", "migrations");
const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

const u = new URL(dbUrl);
const client = new pg.Client({
  host: u.hostname,
  port: Number(u.port) || 5432,
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.slice(1) || "postgres",
  ssl: { rejectUnauthorized: false },
});

const run = async () => {
  await client.connect();
  await client.query("set session check_function_bodies = off");
  await client.query("begin");
  console.log("Resetting public schema...");
  await client.query(RESET);
  console.log(`Applying ${files.length} migrations...`);
  for (const f of files) {
    process.stdout.write(`  ${f} ... `);
    await client.query(readFileSync(join(migrationsDir, f), "utf8"));
    console.log("ok");
  }
  console.log("Loading seed (51-state rules + availability)...");
  await client.query(readFileSync(join(root, "supabase", "seed.sql"), "utf8"));
  console.log("Granting role privileges + reloading API schema...");
  await client.query(GRANTS);
  await client.query("commit");
  console.log("Done. Schema + seed applied successfully.");
};

run()
  .catch(async (e) => {
    try { await client.query("rollback"); } catch {}
    console.error("\nFailed:", e.message);
    process.exit(1);
  })
  .finally(() => client.end());
