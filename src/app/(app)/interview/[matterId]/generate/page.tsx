import { redirect } from "next/navigation";
import Link from "next/link";
import { getMatter } from "@/lib/interview/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "@/components/brand/shield";
import { ATTORNEY_REVIEW_RECOMMENDATION, SELF_HELP_DISCLAIMER } from "@/lib/legal";

/**
 * Handoff after the interview review. Document generation itself is Phase 3
 * (template engine + DOCX/PDF + execution instructions). This confirms the
 * interview is complete and previews what comes next.
 */
export default async function GeneratePage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
  const matter = await getMatter(matterId);
  if (!matter) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <div className="mb-2 flex justify-center">
            <Shield className="h-12 w-auto text-accent" />
          </div>
          <h1 className="text-center font-serif text-2xl font-semibold">
            Your interview is complete
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            Document generation arrives in the next phase. When it&apos;s ready,
            we&apos;ll assemble your signing-ready package with state-specific
            execution instructions.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-accent/40 bg-accent/10 p-4 text-sm">
            <p className="font-medium">{ATTORNEY_REVIEW_RECOMMENDATION}</p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {SELF_HELP_DISCLAIMER}
          </p>
          <Button render={<Link href="/dashboard" />} className="w-full">
            Back to dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
