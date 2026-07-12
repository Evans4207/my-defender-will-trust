import { redirect } from "next/navigation";
import Link from "next/link";
import { getMatter } from "@/lib/interview/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "@/components/brand/shield";
import { GenerateButton } from "@/components/documents/generate-button";
import { ATTORNEY_REVIEW_RECOMMENDATION, SELF_HELP_DISCLAIMER } from "@/lib/legal";

export default async function GeneratePage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
  const matter = await getMatter(matterId);
  if (!matter) redirect("/dashboard");

  // If documents already exist, jump straight to them.
  if (matter.status === "ready_to_sign" || matter.status === "signed") {
    redirect(`/interview/${matterId}/documents`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <div className="mb-2 flex justify-center">
            <Shield className="h-12 w-auto text-accent" />
          </div>
          <h1 className="text-center font-serif text-2xl font-semibold">
            Generate your documents
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            We&apos;ll assemble your signing-ready Will with clauses and execution
            instructions specific to your state.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <GenerateButton matterId={matterId} />
          <div className="rounded-md border border-accent/40 bg-accent/10 p-4 text-sm">
            <p className="font-medium">{ATTORNEY_REVIEW_RECOMMENDATION}</p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {SELF_HELP_DISCLAIMER}
          </p>
          <Button variant="ghost" render={<Link href={`/interview/${matterId}/review`} />} className="w-full">
            Back to review
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
