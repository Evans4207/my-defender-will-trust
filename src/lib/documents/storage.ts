import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "documents";

/** Upload (or overwrite) a document file in the private documents bucket. */
export async function uploadDocument(
  path: string,
  data: Buffer,
  contentType: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, data, { contentType, upsert: true });
  if (error) throw error;
}

/** Create a short-lived signed URL for a private document object. */
export async function createSignedUrl(
  path: string,
  expiresInSeconds = 300,
): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) throw error ?? new Error("Could not create signed URL");
  return data.signedUrl;
}

/**
 * Given a set of object paths, return the subset that actually exists in the
 * bucket. Used to decide whether to offer a PDF download: PDF conversion is
 * best-effort (no Gotenberg/LibreOffice = no PDF), so a `.pdf` may or may not
 * exist next to each `.docx`. Groups by folder to keep this to one list() call
 * per folder rather than one per object.
 */
export async function existingObjects(paths: string[]): Promise<Set<string>> {
  const admin = createAdminClient();
  const found = new Set<string>();

  const byFolder = new Map<string, string[]>();
  for (const p of paths) {
    const slash = p.lastIndexOf("/");
    const folder = slash >= 0 ? p.slice(0, slash) : "";
    const list = byFolder.get(folder) ?? [];
    list.push(p);
    byFolder.set(folder, list);
  }

  for (const [folder, group] of byFolder) {
    const { data } = await admin.storage
      .from(BUCKET)
      .list(folder, { limit: 1000 });
    const names = new Set((data ?? []).map((o) => `${folder}/${o.name}`));
    for (const p of group) if (names.has(p)) found.add(p);
  }

  return found;
}

/** Download a private object's bytes server-side (for the account export). */
export async function downloadDocument(path: string): Promise<Buffer | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}
