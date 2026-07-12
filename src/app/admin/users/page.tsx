import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin — Users" };

type Sub = {
  user_id: string;
  plan: string | null;
  status: string;
  stripe_customer_id: string | null;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const admin = createAdminClient();

  const { data: usersData } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
  let users = usersData?.users ?? [];
  if (q) {
    const needle = q.toLowerCase();
    users = users.filter((u) => (u.email ?? "").toLowerCase().includes(needle));
  }

  const { data: subsData } = await admin
    .from("subscriptions")
    .select("user_id, plan, status, stripe_customer_id");
  const subsByUser = new Map<string, Sub[]>();
  for (const s of (subsData as Sub[] | null) ?? []) {
    if (!subsByUser.has(s.user_id)) subsByUser.set(s.user_id, []);
    subsByUser.get(s.user_id)!.push(s);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-semibold">Users</h1>

      <form className="flex max-w-md gap-2" action="/admin/users" method="get">
        <Input name="q" defaultValue={q ?? ""} placeholder="Search by email…" />
        <Button type="submit">Search</Button>
      </form>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold">
            {users.length} user{users.length === 1 ? "" : "s"}
          </h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Joined</th>
                  <th className="py-2 pr-4">Subscriptions</th>
                  <th className="py-2">Billing</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const subs = subsByUser.get(u.id) ?? [];
                  const customerId = subs.find((s) => s.stripe_customer_id)?.stripe_customer_id;
                  return (
                    <tr key={u.id} className="border-b align-top">
                      <td className="py-2 pr-4 font-medium">{u.email}</td>
                      <td className="py-2 pr-4">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-2 pr-4">
                        {subs.length === 0
                          ? "—"
                          : subs.map((s, i) => (
                              <div key={i}>
                                {s.plan ?? "—"} · <span className="capitalize">{s.status}</span>
                              </div>
                            ))}
                      </td>
                      <td className="py-2">
                        {customerId ? (
                          <a
                            className="underline"
                            href={`https://dashboard.stripe.com/test/customers/${customerId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Stripe (refund)
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
