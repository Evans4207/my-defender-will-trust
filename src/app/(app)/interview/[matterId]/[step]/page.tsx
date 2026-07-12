import { redirect } from "next/navigation";
import { getMatter, getAnswers, resumeStep } from "@/lib/interview/data";
import { isStepKey, stepDef } from "@/lib/interview/steps";
import { logInterviewEvent } from "@/lib/interview/actions";
import { getAvailableStateCodes } from "@/lib/documents/state-rules.server";
import { getUser } from "@/lib/auth/user";
import { WizardProgress } from "@/components/interview/wizard-progress";
import { StepRenderer } from "@/components/interview/step-forms";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default async function InterviewStepPage({
  params,
}: {
  params: Promise<{ matterId: string; step: string }>;
}) {
  const { matterId, step } = await params;

  const matter = await getMatter(matterId);
  if (!matter) redirect("/dashboard");
  if (!isStepKey(step)) redirect(`/interview/${matterId}/${resumeStep(matter)}`);

  const answers = await getAnswers(matterId);
  await logInterviewEvent(matterId, "step_viewed", step);

  // The state step needs availability + the user's email for the waitlist.
  const [availableStates, user] = await Promise.all([
    step === "state" ? getAvailableStateCodes() : Promise.resolve<string[]>([]),
    step === "state" ? getUser() : Promise.resolve(null),
  ]);

  const def = stepDef(step);

  return (
    <div className="mx-auto max-w-2xl">
      <WizardProgress stepKey={step} />
      <Card>
        <CardHeader>
          <h1 className="font-serif text-2xl font-semibold">{def.title}</h1>
        </CardHeader>
        <CardContent>
          <StepRenderer
            matterId={matterId}
            stepKey={step}
            answers={answers}
            docType={matter.doc_type}
            availableStates={availableStates}
            userEmail={user?.email ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
