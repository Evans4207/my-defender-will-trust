import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";

/**
 * Concurrency test for public.redeem_access_code() (build plan Instructions #2:
 * "code redemption (concurrency)"). Proves a multi-use code with max_uses=N
 * cannot be over-redeemed when many users redeem simultaneously — the row lock
 * (SELECT ... FOR UPDATE) serializes them.
 *
 * Requires a real database. Run with:
 *   RUN_DB_TESTS=1 SUPABASE_DB_URL=postgres://... npm test
 * Skipped otherwise so CI stays green before the hosted project exists.
 */
const DB_URL = process.env.SUPABASE_DB_URL;
const ENABLED = process.env.RUN_DB_TESTS === "1" && !!DB_URL;

const CODE = "DFND-QAQA-2345";
const MAX_USES = 3;
const N_USERS = 8;

describe.skipIf(!ENABLED)("redeem_access_code concurrency", () => {
  let pool: Pool;
  const userIds: string[] = [];
  let partnerId: string;
  let codeId: string;

  beforeAll(async () => {
    pool = new Pool({ connectionString: DB_URL, max: N_USERS + 2 });

    // Clean any prior run.
    await pool.query("delete from public.access_codes where code = $1", [CODE]);

    const partner = await pool.query(
      "insert into public.partners (name, discount_pct) values ('QA Test Partner', 50) returning id",
    );
    partnerId = partner.rows[0].id;

    const code = await pool.query(
      "insert into public.access_codes (code, partner_id, package, max_uses) values ($1, $2, 'will', $3) returning id",
      [CODE, partnerId, MAX_USES],
    );
    codeId = code.rows[0].id;

    for (let i = 0; i < N_USERS; i++) {
      const id = randomUUID();
      userIds.push(id);
      await pool.query("insert into auth.users (id, email) values ($1, $2)", [
        id,
        `qa+${id}@example.com`,
      ]);
    }
  });

  afterAll(async () => {
    if (!pool) return;
    await pool.query("delete from public.access_codes where code = $1", [CODE]);
    if (partnerId) {
      await pool.query("delete from public.partners where id = $1", [partnerId]);
    }
    if (userIds.length) {
      await pool.query("delete from auth.users where id = any($1::uuid[])", [
        userIds,
      ]);
    }
    await pool.end();
  });

  it("never lets a code exceed max_uses under concurrent redemption", async () => {
    const attempts = userIds.map(async (uid) => {
      const client = await pool.connect();
      try {
        await client.query("begin");
        // Simulate this user's JWT so auth.uid() resolves inside the function.
        await client.query(
          "select set_config('request.jwt.claims', json_build_object('sub', $1::text)::text, true)",
          [uid],
        );
        await client.query("select * from public.redeem_access_code($1)", [CODE]);
        await client.query("commit");
        return "ok" as const;
      } catch {
        await client.query("rollback").catch(() => {});
        return "err" as const;
      } finally {
        client.release();
      }
    });

    const results = await Promise.all(attempts);
    const succeeded = results.filter((r) => r === "ok").length;

    expect(succeeded).toBe(MAX_USES);

    const { rows: codeRows } = await pool.query(
      "select uses from public.access_codes where id = $1",
      [codeId],
    );
    expect(codeRows[0].uses).toBe(MAX_USES);

    const { rows: redRows } = await pool.query(
      "select count(*)::int as n from public.code_redemptions where code_id = $1",
      [codeId],
    );
    expect(redRows[0].n).toBe(MAX_USES);
  });
});
