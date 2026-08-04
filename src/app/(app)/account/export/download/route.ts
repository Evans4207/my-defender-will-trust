import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { downloadDocument } from "@/lib/documents/storage";
import { createZip, type ZipEntry } from "@/lib/vault/zip";

/**
 * Export everything the customer has: every generated document and every file
 * they uploaded to the vault, as a single ZIP.
 *
 * Deliberately NOT gated on entitlement or membership. This is the customer's
 * own data, and the point of the route is that it stays available when access to
 * the builder or the vault does not. Every lookup goes through the RLS-scoped
 * client, so a user can only ever export their own rows.
 */

const KIND_LABEL: Record<string, string> = {
  will: "Last Will and Testament",
  trust: "Revocable Living Trust",
  pourover: "Pour-Over Will",
  poa: "Durable Financial Power of Attorney",
  healthcare: "Healthcare Directive",
  hipaa: "HIPAA Authorization",
};

/** Who a couples document belongs to, read off the storage path tag. */
function signerLabel(storagePath: string): string {
  if (storagePath.includes("-spouse-")) return " (spouse)";
  if (storagePath.includes("-joint-")) return " (joint)";
  return "";
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  // RLS scopes both reads to this user.
  const [mattersRes, vaultRes] = await Promise.all([
    supabase.from("matters").select("id, doc_type, state, created_at"),
    supabase.from("vault_items").select("name, storage_path"),
  ]);

  const matters =
    (mattersRes.data as
      | { id: string; doc_type: string; state: string | null; created_at: string }[]
      | null) ?? [];

  const entries: ZipEntry[] = [];
  const manifest: string[] = [
    "My Defender Will & Trust — account export",
    `Generated ${new Date().toISOString()}`,
    "",
  ];

  for (const matter of matters) {
    const { data: docsData } = await supabase
      .from("documents")
      .select("kind, storage_path, generated_at")
      .eq("matter_id", matter.id);
    const docs =
      (docsData as
        | { kind: string; storage_path: string | null; generated_at: string | null }[]
        | null) ?? [];

    const folder = `${matter.doc_type}-package${matter.state ? `-${matter.state}` : ""}`;
    for (const doc of docs) {
      if (!doc.storage_path) continue;
      const bytes = await downloadDocument(doc.storage_path);
      if (!bytes) continue;
      const label = KIND_LABEL[doc.kind] ?? doc.kind;
      const name = `${folder}/${label}${signerLabel(doc.storage_path)}.docx`;
      entries.push({ name, data: bytes });
      manifest.push(`${name}  —  generated ${doc.generated_at ?? "unknown"}`);
    }
  }

  const vaultItems =
    (vaultRes.data as { name: string; storage_path: string }[] | null) ?? [];
  for (const item of vaultItems) {
    const bytes = await downloadDocument(item.storage_path);
    if (!bytes) continue;
    const name = `vault/${item.name}`;
    entries.push({ name, data: bytes });
    manifest.push(name);
  }

  if (entries.length === 0) {
    manifest.push("(no files found)");
  }
  entries.push({
    name: "MANIFEST.txt",
    data: new TextEncoder().encode(manifest.join("\n") + "\n"),
  });

  const zip = createZip(entries);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": String(zip.length),
      "Content-Disposition": `attachment; filename="my-documents-${stamp}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
