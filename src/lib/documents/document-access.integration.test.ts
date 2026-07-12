import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";

/**
 * Access-control test for document downloads (build plan Instructions #2:
 * "access control on document downloads"). Proves the documents RLS policy lets
 * an owner read their document row but blocks another authenticated user — the
 * exact guarantee the download route depends on.
 *
 * Requires a real database:
 *   RUN_DB_TESTS=1 SUPABASE_DB_URL=postgres://... npm test
 */
const DB_URL = process.env.SUPABASE_DB_URL;
const ENABLED = process.env.RUN_DB_TESTS === "1" && !!DB_URL;

describe.skipIf(!ENABLED)("documents RLS — owner-only access", () => {
  let pool: Pool;
  const userA = randomUUID();
  const userB = randomUUID();
  let matterId: string;
  let documentId: string;

  beforeAll(async () => {
    pool = new Pool({ connectionString: DB_URL, max: 4 });
    for (const [id, tag] of [
      [userA, "a"],
      [userB, "b"],
    ] as const) {
      await pool.query("insert into auth.users (id, email) values ($1, $2)", [
        id,
        `qa+doc-${tag}-${id}@example.com`,
      ]);
    }
    const m = await pool.query(
      "insert into public.matters (user_id, doc_type, state, status) values ($1, 'will', 'AZ', 'ready_to_sign') returning id",
      [userA],
    );
    matterId = m.rows[0].id;
    const d = await pool.query(
      "insert into public.documents (matter_id, kind, storage_path, status) values ($1, 'will', $2, 'generated') returning id",
      [matterId, `${userA}/${matterId}/will-v1.docx`],
    );
    documentId = d.rows[0].id;
  });

  afterAll(async () => {
    if (!pool) return;
    await pool.query("delete from public.matters where id = $1", [matterId]);
    await pool.query("delete from auth.users where id = any($1::uuid[])", [
      [userA, userB],
    ]);
    await pool.end();
  });

  async function selectAsUser(userId: string): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("set local role authenticated");
      await client.query(
        "select set_config('request.jwt.claims', json_build_object('sub', $1::text)::text, true)",
        [userId],
      );
      const res = await client.query(
        "select id from public.documents where id = $1",
        [documentId],
      );
      return res.rowCount ?? 0;
    } finally {
      await client.query("rollback").catch(() => {});
      client.release();
    }
  }

  it("lets the owner read their document", async () => {
    expect(await selectAsUser(userA)).toBe(1);
  });

  it("blocks a different authenticated user", async () => {
    expect(await selectAsUser(userB)).toBe(0);
  });
});
