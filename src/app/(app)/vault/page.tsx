import type { Metadata } from "next";
import { getEntitlement } from "@/lib/entitlements.server";
import { createClient } from "@/lib/supabase/server";
import { MembershipUpsell } from "@/components/membership-upsell";
import { VaultUploadForm } from "@/components/vault/upload-form";
import { deleteVaultFileAction } from "@/lib/vault/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/checkout-button";

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

  // Gate UPLOADING on membership, never retrieval. A lapsed member must still be
  // able to get back the files they uploaded themselves — stranding a customer's
  // own documents behind a subscription is not an acceptable failure mode.
  // Only someone who has never held a membership sees the upsell.
  if (!entitlement.membership && !entitlement.membershipEver) {
    return <MembershipUpsell feature="The secure document vault" />;
  }

  const readOnly = !entitlement.membership;

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

      {readOnly ? (
        <Card className="border-accent/50 bg-accent/5">
          <CardHeader>
            <h2 className="font-serif text-lg font-semibold">
              Your membership has ended
            </h2>
            <p className="text-sm text-muted-foreground">
              {entitlement.membershipGrace
                ? "You can still download everything here. Renew to upload new files again."
                : "Your files remain available to download for as long as you have an account. Renew to upload new files again."}
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <CheckoutButton
              plan="membership"
              className="bg-accent text-accent-foreground hover:bg-brand-gold-bright"
            >
              Renew membership
            </CheckoutButton>
            <Button variant="outline" render={<a href="/account/export" />}>
              Download everything
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="font-serif text-lg font-semibold">Upload a file</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <VaultUploadForm />
            <Button
              variant="outline"
              size="sm"
              render={<a href="/account/export" />}
            >
              Download everything
            </Button>
          </CardContent>
        </Card>
      )}

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
