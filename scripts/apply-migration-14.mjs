// Applies ONLY migration 20260712000014_entitlement_grants.sql to the hosted
// database, inside a transaction, and reports the backfill counts.
//
// This is deliberately NOT scripts/db-apply.mjs — that one resets the public
// schema and would destroy test data. This script creates the new table and
// backfills it, and does nothing at all if it is already there.
//
// Reads SUPABASE_DB_URL from the environment or .env.local.
// Usage: node scripts/apply-migration-14.mjs
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

const MIGRATION = "20260712000014_entitlement_grants.sql";
const sql = readFileSync(join(root, "supabase", "migrations", MIGRATION), "utf8");

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

const count = async (q) => {
  try {
    const r = await client.query(q);
    return Number(r.rows[0].n);
  } catch {
    return "n/a";
  }
};

try {
  await client.connect();
  console.log("connected\n");

  const exists = await client.query(
    `select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'entitlement_grants'`,
  );
  if (exists.rowCount > 0) {
    const n = await count("select count(*)::int as n from public.entitlement_grants");
    console.log(`entitlement_grants already exists (${n} rows). Nothing to do.`);
    await client.end();
    process.exit(0);
  }

  // What the backfill should pick up.
  const activeSubs = await count(
    `select count(*)::int as n from public.subscriptions
      where plan is not null and status in ('active','trialing')`,
  );
  const compRedemptions = await count(
    `select count(*)::int as n from public.code_redemptions
      where package is not null and coalesce(grants_access, true)`,
  );
  console.log("before:");
  console.log(`  active/trialing subscriptions : ${activeSubs}`);
  console.log(`  access-granting redemptions   : ${compRedemptions}`);
  console.log(`  expected grants after backfill: ${Number(activeSubs) + Number(compRedemptions)}\n`);

  await client.query("begin");
  await client.query(sql);
  await client.query("commit");
  console.log(`applied ${MIGRATION}\n`);

  const grants = await count("select count(*)::int as n from public.entitlement_grants");
  const permanent = await count(
    "select count(*)::int as n from public.entitlement_grants where expires_at is null",
  );
  const byProduct = await client.query(
    `select product::text as product, count(*)::int as n
       from public.entitlement_grants group by product order by product`,
  );
  console.log("after:");
  console.log(`  grants total     : ${grants}`);
  console.log(`  permanent (never expire): ${permanent}`);
  for (const r of byProduct.rows) console.log(`  ${r.product.padEnd(16)}: ${r.n}`);

  if (String(grants) !== String(Number(activeSubs) + Number(compRedemptions))) {
    console.log(
      "\nNOTE: the total does not match the expectation above. That is not necessarily",
    );
    console.log("wrong (a user can hold both a subscription and a redemption), but check it.");
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
