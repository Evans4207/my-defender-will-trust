import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  approveTemplateAction,
  activateTemplateAction,
  deactivateTemplateAction,
} from "@/lib/admin/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin — Templates" };

type Template = {
  id: string;
  kind: string;
  version: number;
  name: string;
  approved_at: string | null;
  active: boolean;
};

export default async function AdminTemplatesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("template_versions")
    .select("id, kind, version, name, approved_at, active")
    .order("kind")
    .order("version", { ascending: false });
  const templates = (data as Template[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A template must be attorney-approved before it can be activated for
          generation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold">Versions</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Template</th>
                  <th className="py-2 pr-4">Version</th>
                  <th className="py-2 pr-4">Approved</th>
                  <th className="py-2 pr-4">Active</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b">
                    <td className="py-2 pr-4 font-medium">{t.name}</td>
                    <td className="py-2 pr-4">v{t.version}</td>
                    <td className="py-2 pr-4">
                      {t.approved_at ? new Date(t.approved_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-2 pr-4">{t.active ? "✓" : "—"}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        {!t.approved_at && (
                          <form action={approveTemplateAction.bind(null, t.id)}>
                            <Button type="submit" size="sm" variant="outline">Approve</Button>
                          </form>
                        )}
                        {t.approved_at && !t.active && (
                          <form action={activateTemplateAction.bind(null, t.id, t.kind)}>
                            <Button type="submit" size="sm">Activate</Button>
                          </form>
                        )}
                        {t.active && (
                          <form action={deactivateTemplateAction.bind(null, t.id)}>
                            <Button type="submit" size="sm" variant="ghost">Deactivate</Button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
