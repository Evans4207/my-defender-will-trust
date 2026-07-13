// Seeds a test partner + two reusable access codes for end-to-end testing.
// Usage: node scripts/seed-test-data.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
function dbUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  const t = readFileSync(join(root, ".env.local"), "utf8");
  return t.match(/^\s*SUPABASE_DB_URL\s*=\s*"?([^"\n]+)"?\s*$/m)?.[1];
}

const u = new URL(dbUrl());
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
  await client.query(`
    insert into public.partners (name, contact, discount_pct, default_package)
    values ('Test Partner', 'test@example.com', 100, 'will')
    on conflict do nothing;
  `);
  const { rows } = await client.query(
    `select id from public.partners where name = 'Test Partner' limit 1;`,
  );
  const partnerId = rows[0].id;
  await client.query(
    `insert into public.access_codes (code, partner_id, package, max_uses, discount_pct)
     values ('DFND-TEST-2345', $1, 'will',  999, 100),  -- comp: free (bypasses Stripe)
            ('DFND-TRST-2345', $1, 'trust', 999, 100),  -- comp: free (bypasses Stripe)
            ('DFND-DSCT-2345', $1, 'will',  999, 50),   -- discount: 50% off via Stripe
            ('DFND-HALF-2345', $1, 'trust', 999, 50)    -- discount: 50% off via Stripe
     on conflict (code) do nothing;`,
    [partnerId],
  );
  console.log("Seeded codes: DFND-TEST-2345/DFND-TRST-2345 (comp/free), DFND-DSCT-2345/DFND-HALF-2345 (50% discount)");
};

run()
  .catch((e) => { console.error("Failed:", e.message); process.exit(1); })
  .finally(() => client.end());
