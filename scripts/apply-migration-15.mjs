// Applies ONLY migration 20260712000015_households.sql to the hosted database,
// inside a transaction, and reports what was created.
//
// This is deliberately NOT scripts/db-apply.mjs — that one resets the public
// schema and would destroy the data Donovan is testing against. This script is
// additive and does nothing at all if the household tables already exist.
//
// Reads SUPABASE_DB_URL from the environment or .env.local.
// Usage: node scripts/apply-migration-15.mjs
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

const MIGRATION = "20260712000015_households.sql";
const sql = readFileSync(join(root, "supabase", "migrations", MIGRATION), "utf8");

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

const scalar = async (q) => {
  try {
    const r = await client.query(q);
    return r.rows[0]?.n ?? "n/a";
  } catch {
    return "n/a";
  }
};

try {
  await client.connect();
  console.log("connected\n");

  const exists = await client.query(
    `select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'households'`,
  );
  if (exists.rowCount > 0) {
    console.log("households already exists. Nothing to do (additive, idempotent).");
    await client.end();
    process.exit(0);
  }

  // The migration wraps its own begin/commit.
  await client.query(sql);
  console.log(`applied ${MIGRATION}\n`);

  // Report the additive result.
  const docs = await scalar("select count(*)::int as n from public.documents");
  const backfilled = await scalar(
    "select count(*)::int as n from public.documents where owner_user_id is not null",
  );
  const priv = await scalar(
    "select count(*)::int as n from public.documents where scope = 'private'",
  );
  console.log("after:");
  console.log(`  households / household_members / household_invites: created (0 rows)`);
  console.log(`  documents total                 : ${docs}`);
  console.log(`  documents with owner_user_id set : ${backfilled} (should equal total)`);
  console.log(`  documents scope = 'private'      : ${priv} (should equal total)`);

  if (String(docs) !== String(backfilled)) {
    console.log(
      "\nNOTE: some documents did not get an owner_user_id (their matter may be missing).",
    );
    console.log("Investigate before relying on ownership routing.");
  }

  await client.end();
  console.log("\ndone");
} catch (err) {
  try { await client.query("rollback"); } catch {}
  console.error("\nFAILED — rolled back, nothing was changed.");
  console.error(err.message);
  try { await client.end(); } catch {}
  process.exit(1);
}
