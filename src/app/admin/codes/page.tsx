import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin — Access codes" };

type Code = {
  code: string;
  partner_id: string;
  package: string;
  uses: number;
  max_uses: number;
  active: boolean;
  expires_at: string | null;
};

export default async function AdminCodesPage() {
  const supabase = await createClient();
  const [codesRes, partnersRes] = await Promise.all([
    supabase
      .from("access_codes")
      .select("code, partner_id, package, uses, max_uses, active, expires_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("partners").select("id, name"),
  ]);
  const codes = (codesRes.data as Code[] | null) ?? [];
  const partnerName = new Map(
    ((partnersRes.data as { id: string; name: string }[] | null) ?? []).map((p) => [p.id, p.name]),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">Access codes</h1>
        <Button variant="outline" render={<Link href="/admin/codes/export" />}>
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold">
            Recent codes ({codes.length})
          </h2>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No codes yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2 pr-4">Partner</th>
                    <th className="py-2 pr-4">Package</th>
                    <th className="py-2 pr-4">Uses</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.code} className="border-b">
                      <td className="py-2 pr-4 font-mono">{c.code}</td>
                      <td className="py-2 pr-4">{partnerName.get(c.partner_id) ?? "—"}</td>
                      <td className="py-2 pr-4 capitalize">{c.package}</td>
                      <td className="py-2 pr-4">{c.uses}/{c.max_uses}</td>
                      <td className="py-2 pr-4">{c.active ? "Active" : "Inactive"}</td>
                      <td className="py-2">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
