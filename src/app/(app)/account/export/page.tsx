import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Download everything" };

/**
 * Export landing screen. The actual ZIP is served by the child route handler at
 * /account/export/download — navigating a browser straight to that handler just
 * triggers a file download with no page to land on, which reads as "nothing
 * happened." This screen gives the action a home: it explains what's in the
 * archive, then links to the download. Reachable from the account page, so it
 * does not depend on holding a membership (unlike the vault entry points).
 */
export default async function ExportPage() {
  const supabase = await createClient();

  // RLS scopes both counts to the signed-in user. Purely informational — the
  // download route rebuilds the archive itself.
  const [{ count: docCount }, { count: vaultCount }] = await Promise.all([
    supabase.from("documents").select("id", { count: "exact", head: true }),
    supabase.from("vault_items").select("id", { count: "exact", head: true }),
  ]);

  const documents = docCount ?? 0;
  const vaultFiles = vaultCount ?? 0;
  const hasSomething = documents + vaultFiles > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Download everything</h1>
        <p className="mt-1 text-muted-foreground">
          Get a single ZIP file with all of your generated documents and every
          file you&apos;ve saved to your vault. This is your own data — it stays
          available to download whether or not you have an active membership.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold">What&apos;s included</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-1 text-sm">
            <li>
              <span className="font-medium">{documents}</span> generated{" "}
              {documents === 1 ? "document" : "documents"} (Word .docx files)
            </li>
            <li>
              <span className="font-medium">{vaultFiles}</span> vault{" "}
              {vaultFiles === 1 ? "file" : "files"} you uploaded
            </li>
            <li>A MANIFEST.txt listing everything in the archive</li>
          </ul>

          {hasSomething ? (
            <Button render={<a href="/account/export/download" />}>
              Download my ZIP
            </Button>
          ) : (
            <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              You don&apos;t have any documents or vault files yet. Once you
              generate documents, they&apos;ll show up here to download.
            </div>
          )}
        </CardContent>
      </Card>

      <Button variant="ghost" render={<Link href="/account" />}>
        Back to account
      </Button>
    </div>
  );
}
