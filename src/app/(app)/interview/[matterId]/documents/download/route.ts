import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSignedUrl } from "@/lib/documents/storage";

/**
 * Owner-only document download. The document row is fetched through the user's
 * RLS-scoped client, so a user can only ever resolve their OWN documents; we
 * then mint a short-lived signed URL for the private storage object.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matterId: string }> },
) {
  const { matterId } = await params;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const format = searchParams.get("format") === "pdf" ? "pdf" : "docx";
  if (!id) return new NextResponse("Missing document id", { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  // RLS ensures this only returns a document the user owns.
  const { data } = await supabase
    .from("documents")
    .select("id, storage_path")
    .eq("id", id)
    .eq("matter_id", matterId)
    .maybeSingle();

  const doc = data as { id: string; storage_path: string | null } | null;
  if (!doc || !doc.storage_path) {
    return new NextResponse("Not found", { status: 404 });
  }

  const path =
    format === "pdf" ? doc.storage_path.replace(/\.docx$/, ".pdf") : doc.storage_path;

  try {
    const url = await createSignedUrl(path, 120);
    return NextResponse.redirect(url);
  } catch {
    return new NextResponse(
      format === "pdf" ? "PDF not available for this document." : "File not found.",
      { status: 404 },
    );
  }
}
