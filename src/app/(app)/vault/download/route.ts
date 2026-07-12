import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSignedUrl } from "@/lib/documents/storage";

/** Owner-only vault download (RLS-scoped lookup + short-lived signed URL). */
export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  // RLS ensures only the owner's row resolves.
  const { data } = await supabase
    .from("vault_items")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  const item = data as { storage_path: string } | null;
  if (!item) return new NextResponse("Not found", { status: 404 });

  try {
    const url = await createSignedUrl(item.storage_path, 120);
    return NextResponse.redirect(url);
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}
