import { redirect } from "next/navigation";
import { getMatter, resumeStep } from "@/lib/interview/data";

/** Entry point — bounce to the step the user should resume on. */
export default async function InterviewResumePage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
  const matter = await getMatter(matterId);
  if (!matter) redirect("/dashboard");
  redirect(`/interview/${matterId}/${resumeStep(matter)}`);
}
