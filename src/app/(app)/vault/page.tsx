import type { Metadata } from "next";
import { getEntitlement } from "@/lib/entitlements.server";
import { createClient } from "@/lib/supabase/server";
import { MembershipUpsell } from "@/components/membership-upsell";
import { VaultUploadForm } from "@/components/vault/upload-form";
import { deleteVaultFileAction } from "@/lib/vault/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Secure vault" };

type VaultRow = {
  id: string;
  name: string;
  size_bytes: number | null;
  created_at: string;
};

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function VaultPage() {
  const entitlement = await getEntitlement();
  if (!entitlement.membership) {
    return <MembershipUpsell feature="The secure document vault" />;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("vault_items")
    .select("id, name, size_bytes, created_at")
    .order("created_at", { ascending: false });
  const items = (data as VaultRow[] | null) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Secure vault</h1>
        <p className="mt-1 text-muted-foreground">
          Encrypted storage for your executed documents, deeds, insurance
          policies, and account lists. Only you can access these files.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold">Upload a file</h2>
        </CardHeader>
        <CardContent>
          <VaultUploadForm />
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No files yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(item.size_bytes)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={<a href={`/vault/download?id=${item.id}`} />}
                >
                  Download
                </Button>
                <form action={deleteVaultFileAction.bind(null, item.id)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    Delete
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
