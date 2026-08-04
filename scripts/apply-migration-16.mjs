// Applies ONLY migration 20260712000016_household_rpcs.sql to the hosted
// database, inside the migration's own transaction. Additive (create-or-replace
// functions); safe to re-run. NOT scripts/db-apply.mjs.
//
// Reads SUPABASE_DB_URL from the environment or .env.local.
// Usage: node scripts/apply-migration-16.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function readEnvLocal(key) {
  try {
    const text = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(new RegExp(`^\\s*${key}\\s*=\\s*"?([^"\\n]+)"?\\s*$`));
      if (m) return m[1].trim();
    }
  } catch {}
  return undefined;
}

const url = process.env.SUPABASE_DB_URL || readEnvLocal("SUPABASE_DB_URL");
if (!url) {
  console.error("SUPABASE_DB_URL is not set (checked the environment and .env.local).");
  process.exit(1);
}

const MIGRATION = "20260712000016_household_rpcs.sql";
const sql = readFileSync(join(root, "supabase", "migrations", MIGRATION), "utf8");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log("connected\n");

  // The household tables (migration 15) must exist first.
  const dep = await client.query(
    `select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'households'`,
  );
  if (dep.rowCount === 0) {
    console.error("households table missing — apply migration 15 first (apply-migration-15.mjs).");
    await client.end();
    process.exit(1);
  }

  await client.query(sql); // wraps its own begin/commit
  console.log(`applied ${MIGRATION}\n`);

  const fns = await client.query(
    `select proname from pg_proc
      where proname in ('create_household','issue_household_invite','revoke_household_invite','accept_household_invite')
      order by proname`,
  );
  console.log("functions present:");
  for (const r of fns.rows) console.log(`  ${r.proname}`);

  await client.end();
  console.log("\ndone");
} catch (err) {
  try { await client.query("rollback"); } catch {}
  console.error("\nFAILED — rolled back, nothing was changed.");
  console.error(err.message);
  try { await client.end(); } catch {}
  process.exit(1);
}
