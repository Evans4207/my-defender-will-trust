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

/** Download a private object's bytes server-side (for the account export). */
export async function downloadDocument(path: string): Promise<Buffer | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}
