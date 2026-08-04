import { redirect } from "next/navigation";
import Link from "next/link";
import { getMatter } from "@/lib/interview/data";
import { createClient } from "@/lib/supabase/server";
import { existingObjects } from "@/lib/documents/storage";
import { STATE_NAMES } from "@/lib/interview/states";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SELF_HELP_DISCLAIMER } from "@/lib/legal";

type DocRow = {
  id: string;
  kind: string;
  status: string;
  generated_at: string | null;
  storage_path: string | null;
};

type HouseholdDocRow = DocRow & { matter_id: string };

const KIND_LABEL: Record<string, string> = {
  will: "Last Will & Testament",
  trust: "Revocable Living Trust",
  pourover: "Pour-Over Will",
  poa: "Durable Financial Power of Attorney",
  healthcare: "Healthcare Directive",
  hipaa: "HIPAA Authorization",
};

/** For couples, the storage path is tagged by signer — surface who each doc is for. */
function ownerSuffix(storagePath: string | null): string {
  const p = storagePath ?? "";
  if (p.includes("-spouse-")) return " — Your spouse";
  if (p.includes("-primary-")) return " — You";
  if (p.includes("-joint-")) return " — Joint (both of you)";
  return "";
}

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
  const matter = await getMatter(matterId);
  if (!matter) redirect("/dashboard");

  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("id, kind, status, generated_at, storage_path")
    .eq("matter_id", matterId)
    .order("generated_at", { ascending: false });
  const docs = (data as DocRow[] | null) ?? [];

  // Household-shared documents (the joint trust) live on the OTHER member's
  // matter, so they are not in the matter-scoped list above. RLS returns only
  // household-scoped documents the viewer may read (migration 15); excluding the
  // current matter avoids showing the account holder their own joint trust twice.
  // Empty for a solo user, so the individual flow is unchanged.
  const { data: sharedData } = await supabase
    .from("documents")
    .select("id, kind, status, generated_at, storage_path, matter_id")
    .eq("scope", "household")
    .neq("matter_id", matterId)
    .order("generated_at", { ascending: false });
  const sharedDocs = (sharedData as HouseholdDocRow[] | null) ?? [];

  // PDF export is best-effort (no converter configured = DOCX only), so a `.pdf`
  // may not exist beside every `.docx`. Resolve which PDFs are actually present
  // and only offer the button when one is — a dead "Download PDF" that lands on a
  // raw error page reads as broken. `pdfPathFor` mirrors the download route's
  // derivation so the offered link resolves to a real object.
  const pdfPathFor = (storagePath: string | null): string | null =>
    storagePath ? storagePath.replace(/\.docx$/, ".pdf") : null;
  const candidatePdfs = [...docs, ...sharedDocs]
    .map((d) => pdfPathFor(d.storage_path))
    .filter((p): p is string => p !== null);
  const availablePdfs = await existingObjects(candidatePdfs);
  const hasPdf = (storagePath: string | null): boolean => {
    const p = pdfPathFor(storagePath);
    return p !== null && availablePdfs.has(p);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Your documents</h1>
        <p className="mt-1 text-muted-foreground">
          {matter.state ? `Prepared for ${STATE_NAMES[matter.state] ?? matter.state}. ` : ""}
          Download, then follow the execution instructions to sign.
        </p>
      </div>

      {docs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No documents yet.{" "}
            <Link href={`/interview/${matterId}/generate`} className="underline">
              Generate them now
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        docs.map((d) => (
          <Card key={d.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold">
                  {KIND_LABEL[d.kind] ?? d.kind}
                  <span className="text-muted-foreground">{ownerSuffix(d.storage_path)}</span>
                </h2>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize">
                  {d.status.replace(/_/g, " ")}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                render={
                  <a href={`/interview/${matterId}/documents/download?id=${d.id}&format=docx`} />
                }
              >
                Download DOCX
              </Button>
              {hasPdf(d.storage_path) && (
                <Button
                  variant="outline"
                  render={
                    <a href={`/interview/${matterId}/documents/download?id=${d.id}&format=pdf`} />
                  }
                >
                  Download PDF
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {sharedDocs.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-serif text-xl font-semibold">Shared with your household</h2>
            <p className="text-sm text-muted-foreground">
              Documents you share with the other member of your household, such as your joint
              trust. You can download them, but only their owner can change them.
            </p>
          </div>
          {sharedDocs.map((d) => (
            <Card key={d.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-semibold">
                    {KIND_LABEL[d.kind] ?? d.kind}
                    <span className="text-muted-foreground"> — Joint (both of you)</span>
                  </h3>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize">
                    {d.status.replace(/_/g, " ")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button
                  render={
                    <a href={`/interview/${d.matter_id}/documents/download?id=${d.id}&format=docx`} />
                  }
                >
                  Download DOCX
                </Button>
                {hasPdf(d.storage_path) && (
                  <Button
                    variant="outline"
                    render={
                      <a href={`/interview/${d.matter_id}/documents/download?id=${d.id}&format=pdf`} />
                    }
                  >
                    Download PDF
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" render={<Link href={`/interview/${matterId}/instructions`} />}>
          Execution instructions
        </Button>
        <Button variant="outline" render={<Link href={`/interview/${matterId}/review`} />}>
          Update &amp; regenerate
        </Button>
        {matter.household_id && (
          <Button variant="outline" render={<Link href="/household" />}>
            Manage household
          </Button>
        )}
        {matter.doc_type === "trust" && (
          <Button variant="outline" render={<Link href={`/interview/${matterId}/funding`} />}>
            Trust funding tracker
          </Button>
        )}
        <Button variant="ghost" render={<Link href="/dashboard" />}>
          Back to dashboard
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {SELF_HELP_DISCLAIMER}
      </p>
    </div>
  );
}
