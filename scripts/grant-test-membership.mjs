// Grants a MEMBERSHIP entitlement to test accounts so the vault, annual checkup and
// trust funding tracker can be exercised before Stripe is connected.
//
// Writes a grant with source = 'manual' and a one-year expiry, which is exactly what
// that enum value is for. Nothing else is touched: no subscriptions row is faked, so
// the billing portal still behaves as an unconfigured-Stripe install should.
//
// Usage:
//   node scripts/grant-test-membership.mjs                 # every existing tester
//   node scripts/grant-test-membership.mjs a@example.com   # just this account
//   node scripts/grant-test-membership.mjs --revoke a@b.c  # take it back
//
// Reads SUPABASE_DB_URL from the environment or .env.local.
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

const args = process.argv.slice(2);
const revoke = args.includes("--revoke");
const email = args.find((a) => !a.startsWith("--"));

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

const MONTHS = 12;

try {
  await client.connect();

  const exists = await client.query(
    `select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'entitlement_grants'`,
  );
  if (exists.rowCount === 0) {
    console.error("entitlement_grants does not exist. Run apply-migration.command first.");
    process.exit(1);
  }

  // Who to act on: a named account, or everyone already holding a package grant
  // (i.e. the existing test cohort) — never every user in the database.
  const targets = email
    ? await client.query(`select id, email from auth.users where lower(email) = lower($1)`, [email])
    : await client.query(
        `select distinct u.id, u.email
           from auth.users u
           join public.entitlement_grants g on g.user_id = u.id
          where g.product in ('will','trust')
            and g.revoked_at is null
          order by u.email`,
      );

  if (targets.rowCount === 0) {
    console.log(email ? `No account found for ${email}.` : "No test accounts hold a will or trust grant yet.");
    await client.end();
    process.exit(0);
  }

  console.log(`${revoke ? "Revoking" : "Granting"} membership for ${targets.rowCount} account(s):\n`);

  for (const user of targets.rows) {
    const live = await client.query(
      `select id, expires_at from public.entitlement_grants
        where user_id = $1 and product = 'membership'
          and revoked_at is null
          and (expires_at is null or expires_at > now())`,
      [user.id],
    );

    if (revoke) {
      if (live.rowCount === 0) {
        console.log(`  ${user.email.padEnd(34)} no active membership grant — skipped`);
        continue;
      }
      await client.query(
        `update public.entitlement_grants
            set revoked_at = now(), revoked_reason = 'test membership withdrawn'
          where user_id = $1 and product = 'membership' and revoked_at is null`,
        [user.id],
      );
      console.log(`  ${user.email.padEnd(34)} REVOKED`);
      continue;
    }

    if (live.rowCount > 0) {
      const until = live.rows[0].expires_at
        ? new Date(live.rows[0].expires_at).toISOString().slice(0, 10)
        : "never";
      console.log(`  ${user.email.padEnd(34)} already a member until ${until} — skipped`);
      continue;
    }

    const r = await client.query(
      `insert into public.entitlement_grants (user_id, product, source, expires_at)
       values ($1, 'membership', 'manual', now() + ($2 || ' months')::interval)
       returning expires_at`,
      [user.id, String(MONTHS)],
    );
    const until = new Date(r.rows[0].expires_at).toISOString().slice(0, 10);
    console.log(`  ${user.email.padEnd(34)} GRANTED until ${until}`);
  }

  const total = await client.query(
    `select count(*)::int as n from public.entitlement_grants
      where product = 'membership' and revoked_at is null
        and (expires_at is null or expires_at > now())`,
  );
  console.log(`\nActive membership grants now: ${total.rows[0].n}`);
  console.log("These are TEST grants (source = manual). Revoke with --revoke before launch.");

  await client.end();
} catch (err) {
  console.error("\nFAILED:", err.message);
  try { await client.end(); } catch {}
  process.exit(1);
}
