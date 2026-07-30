// Temporarily removes, then restores, a test account's will/trust entitlement, so
// section 13 of the test plan can actually be exercised: documents you own must stay
// reachable when your purchase does not.
//
// Only ever touches grants it revoked itself (identified by the reason string), so
// --restore cannot resurrect a grant that was revoked for a real reason such as a
// refund.
//
// Usage:
//   node scripts/toggle-test-access.mjs someone@example.com --revoke
//   node scripts/toggle-test-access.mjs someone@example.com --restore
//   node scripts/toggle-test-access.mjs someone@example.com            # show state
//
// Reads SUPABASE_DB_URL from the environment or .env.local.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const REASON = "test: access removed to verify document retention";

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

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith("--"));
const revoke = args.includes("--revoke");
const restore = args.includes("--restore");

if (!email) {
  console.error("Usage: node scripts/toggle-test-access.mjs <email> [--revoke|--restore]");
  process.exit(1);
}
if (revoke && restore) {
  console.error("Pick one of --revoke or --restore, not both.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function show(userId) {
  const r = await client.query(
    `select product::text as product, expires_at, revoked_at, revoked_reason
       from public.entitlement_grants
      where user_id = $1 order by product`,
    [userId],
  );
  if (r.rowCount === 0) {
    console.log("  (no grants)");
    return;
  }
  for (const g of r.rows) {
    const state = g.revoked_at
      ? `revoked (${g.revoked_reason ?? "no reason"})`
      : g.expires_at
        ? `active until ${new Date(g.expires_at).toISOString().slice(0, 10)}`
        : "active, never expires";
    console.log(`  ${g.product.padEnd(12)} ${state}`);
  }
}

try {
  await client.connect();
  const u = await client.query(`select id, email from auth.users where lower(email) = lower($1)`, [email]);
  if (u.rowCount === 0) {
    console.error(`No account found for ${email}.`);
    process.exit(1);
  }
  const user = u.rows[0];
  console.log(`\n${user.email}\n\nbefore:`);
  await show(user.id);

  if (revoke) {
    const r = await client.query(
      `update public.entitlement_grants
          set revoked_at = now(), revoked_reason = $2
        where user_id = $1 and product in ('will','trust') and revoked_at is null`,
      [user.id, REASON],
    );
    console.log(`\nrevoked ${r.rowCount} package grant(s).`);
  } else if (restore) {
    const r = await client.query(
      `update public.entitlement_grants
          set revoked_at = null, revoked_reason = null
        where user_id = $1 and product in ('will','trust') and revoked_reason = $2`,
      [user.id, REASON],
    );
    console.log(`\nrestored ${r.rowCount} package grant(s).`);
    if (r.rowCount === 0) {
      console.log("Nothing this script revoked was found. Grants revoked for other");
      console.log("reasons (a refund, say) are deliberately left alone.");
    }
  }

  if (revoke || restore) {
    console.log("\nafter:");
    await show(user.id);
    console.log("\nHave the tester reload the dashboard.");
  }
  await client.end();
} catch (err) {
  console.error("\nFAILED:", err.message);
  try { await client.end(); } catch {}
  process.exit(1);
}
