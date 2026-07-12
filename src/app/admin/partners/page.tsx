import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createPartnerAction, createCodeBatchAction } from "@/lib/admin/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin — Partners" };

type Partner = { id: string; name: string; discount_pct: number; active: boolean };
type CodeAgg = { partner_id: string; uses: number; max_uses: number };

export default async function AdminPartnersPage() {
  const supabase = await createClient();
  const [partnersRes, codesRes] = await Promise.all([
    supabase.from("partners").select("id, name, discount_pct, active").order("name"),
    supabase.from("access_codes").select("partner_id, uses, max_uses"),
  ]);
  const partners = (partnersRes.data as Partner[] | null) ?? [];
  const codes = (codesRes.data as CodeAgg[] | null) ?? [];

  const issued = new Map<string, number>();
  const redeemed = new Map<string, number>();
  for (const c of codes) {
    issued.set(c.partner_id, (issued.get(c.partner_id) ?? 0) + 1);
    redeemed.set(c.partner_id, (redeemed.get(c.partner_id) ?? 0) + c.uses);
  }

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl font-semibold">Partners</h1>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold">Reporting</h2>
        </CardHeader>
        <CardContent>
          {partners.length === 0 ? (
            <p className="text-sm text-muted-foreground">No partners yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Partner</th>
                    <th className="py-2 pr-4">Discount</th>
                    <th className="py-2 pr-4">Codes issued</th>
                    <th className="py-2 pr-4">Redeemed</th>
                    <th className="py-2">Export</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="py-2 pr-4 font-medium">{p.name}</td>
                      <td className="py-2 pr-4">{p.discount_pct}%</td>
                      <td className="py-2 pr-4">{issued.get(p.id) ?? 0}</td>
                      <td className="py-2 pr-4">{redeemed.get(p.id) ?? 0}</td>
                      <td className="py-2">
                        <Link className="underline" href={`/admin/codes/export?partner=${p.id}`}>
                          CSV
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-serif text-lg font-semibold">Add partner</h2>
          </CardHeader>
          <CardContent>
            <form action={createPartnerAction} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact">Contact (optional)</Label>
                <Input id="contact" name="contact" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="discount_pct">Default discount %</Label>
                <Input id="discount_pct" name="discount_pct" type="number" defaultValue={50} min={0} max={100} />
              </div>
              <Button type="submit">Create partner</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-serif text-lg font-semibold">Generate code batch</h2>
          </CardHeader>
          <CardContent>
            {partners.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add a partner first.</p>
            ) : (
              <form action={createCodeBatchAction} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="partner_id">Partner</Label>
                  <select id="partner_id" name="partner_id" required className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="count">How many</Label>
                    <Input id="count" name="count" type="number" defaultValue={10} min={1} max={500} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="max_uses">Uses per code</Label>
                    <Input id="max_uses" name="max_uses" type="number" defaultValue={1} min={1} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="package">Package</Label>
                    <select id="package" name="package" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                      <option value="will">Will</option>
                      <option value="trust">Trust</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="discount_pct_code">Discount % (blank = partner default)</Label>
                    <Input id="discount_pct_code" name="discount_pct" type="number" min={0} max={100} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expires_at">Expires (optional)</Label>
                  <Input id="expires_at" name="expires_at" type="date" />
                </div>
                <Button type="submit">Generate codes</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
