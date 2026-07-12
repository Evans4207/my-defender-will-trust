import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/role";
import { toCsv } from "@/lib/admin/csv";

/** Admin-only CSV export of access codes (optionally filtered by ?partner=id). */
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) return new NextResponse("Forbidden", { status: 403 });

  const partnerId = new URL(request.url).searchParams.get("partner");
  const supabase = await createClient();

  let query = supabase
    .from("access_codes")
    .select("code, partner_id, package, uses, max_uses, discount_pct, active, expires_at, created_at");
  if (partnerId) query = query.eq("partner_id", partnerId);
  const { data } = await query;

  const { data: partnersData } = await supabase.from("partners").select("id, name");
  const partnerName = new Map(
    ((partnersData as { id: string; name: string }[] | null) ?? []).map((p) => [p.id, p.name]),
  );

  const codes =
    (data as {
      code: string;
      partner_id: string;
      package: string;
      uses: number;
      max_uses: number;
      discount_pct: number | null;
      active: boolean;
      expires_at: string | null;
      created_at: string;
    }[] | null) ?? [];

  const csv = toCsv(
    ["code", "partner", "package", "uses", "max_uses", "discount_pct", "active", "expires_at", "created_at"],
    codes.map((c) => [
      c.code,
      partnerName.get(c.partner_id) ?? "",
      c.package,
      c.uses,
      c.max_uses,
      c.discount_pct,
      c.active ? "yes" : "no",
      c.expires_at,
      c.created_at,
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="access-codes${partnerId ? `-${partnerId}` : ""}.csv"`,
    },
  });
}
