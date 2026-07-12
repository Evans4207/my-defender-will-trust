import { redirect } from "next/navigation";
import Link from "next/link";
import { getMatter } from "@/lib/interview/data";
import { getStateRuleset } from "@/lib/documents/state-rules.server";
import { buildExecutionInstructions } from "@/lib/documents/execution-instructions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/documents/print-button";
import { SELF_HELP_DISCLAIMER } from "@/lib/legal";

export default async function InstructionsPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
  const matter = await getMatter(matterId);
  if (!matter) redirect("/dashboard");
  if (!matter.state) redirect(`/interview/${matterId}/state`);

  const ruleset = await getStateRuleset(matter.state, "will");
  const inst = buildExecutionInstructions(ruleset);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold">
            How to sign in {inst.stateName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Follow these steps to make your Will valid in your state.
          </p>
        </div>
        <div className="print:hidden">
          <PrintButton label="Print" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold">Requirements</h2>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <div>Witnesses required: <strong>{inst.witnesses}</strong></div>
          <div>Notarize the will: <strong>{inst.notarizationRequired ? "Yes" : "No"}</strong></div>
          <div>
            Self-proving affidavit:{" "}
            <strong>
              {inst.selfProvingAvailable === true
                ? inst.selfProvingRequiresNotary
                  ? "Yes (notary)"
                  : "Yes (declaration)"
                : inst.selfProvingAvailable === "uncertain"
                  ? "Confirm with counsel"
                  : "No"}
            </strong>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold">Step by step</h2>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {inst.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold">Printable checklist</h2>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {inst.checklist.map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="inline-block size-4 rounded border border-input" />
                {c}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {SELF_HELP_DISCLAIMER}
      </p>

      <div className="print:hidden">
        <Button variant="ghost" render={<Link href={`/interview/${matterId}/documents`} />}>
          Back to documents
        </Button>
      </div>
    </div>
  );
}
