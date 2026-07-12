"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { completeStepAction } from "@/lib/interview/actions";
import { STATE_NAMES } from "@/lib/interview/states";
import { WILL_STEPS, type StepKey } from "@/lib/interview/steps";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SELF_HELP_DISCLAIMER, ATTORNEY_REVIEW_RECOMMENDATION } from "@/lib/legal";

type Answers = Record<string, Record<string, unknown>>;
const s = (v: unknown) => (typeof v === "string" ? v : "");

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}

function Section({
  stepKey,
  matterId,
  children,
}: {
  stepKey: StepKey;
  matterId: string;
  children: React.ReactNode;
}) {
  const title = WILL_STEPS.find((w) => w.key === stepKey)?.title ?? stepKey;
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold">{title}</h3>
        <Link
          href={`/interview/${matterId}/${stepKey}`}
          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Edit
        </Link>
      </div>
      <div className="divide-y divide-border/60">{children}</div>
    </div>
  );
}

export function ReviewStep({
  matterId,
  answers,
}: {
  matterId: string;
  answers: Answers;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const about = answers.about ?? {};
  const family = answers.family ?? {};
  const fid = answers.fiduciaries ?? {};
  const dist = answers.distributions ?? {};
  const ancillary = answers.ancillary ?? {};
  const children = Array.isArray(family.children) ? family.children : [];
  const beneficiaries = Array.isArray(dist.beneficiaries) ? dist.beneficiaries : [];

  const onContinue = () => {
    setError(null);
    start(async () => {
      const res = await completeStepAction(matterId, "review", {});
      if (res?.error) setError(res.error);
    });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Review your answers below. Click <strong>Edit</strong> on any section to
        make changes.
      </p>

      <Section stepKey="state" matterId={matterId}>
        <Row label="State" value={STATE_NAMES[s(answers.state?.state)] ?? "—"} />
      </Section>

      <Section stepKey="about" matterId={matterId}>
        <Row label="Full legal name" value={s(about.fullName)} />
        <Row label="Date of birth" value={s(about.dob)} />
        <Row label="Marital status" value={s(about.maritalStatus)} />
      </Section>

      <Section stepKey="family" matterId={matterId}>
        {s(family.spouseName) && <Row label="Spouse" value={s(family.spouseName)} />}
        <Row
          label="Children"
          value={
            children.length
              ? children.map((c) => s((c as { name?: unknown }).name)).join(", ")
              : "None listed"
          }
        />
      </Section>

      <Section stepKey="fiduciaries" matterId={matterId}>
        <Row label="Executor" value={s(fid.executorName)} />
        {s(fid.guardianName) && <Row label="Guardian" value={s(fid.guardianName)} />}
      </Section>

      <Section stepKey="distributions" matterId={matterId}>
        {beneficiaries.length ? (
          beneficiaries.map((b, i) => {
            const bb = b as { name?: unknown; percent?: unknown };
            return <Row key={i} label={s(bb.name)} value={`${s(String(bb.percent))}%`} />;
          })
        ) : (
          <Row label="Beneficiaries" value="None" />
        )}
      </Section>

      <Section stepKey="ancillary" matterId={matterId}>
        <Row label="Financial POA agent" value={s(ancillary.financialPoaAgent)} />
        <Row label="Healthcare agent" value={s(ancillary.healthcareAgent)} />
      </Section>

      <Alert>
        <AlertDescription className="space-y-2">
          <p className="font-medium">{ATTORNEY_REVIEW_RECOMMENDATION}</p>
          <p className="text-xs">{SELF_HELP_DISCLAIMER}</p>
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button variant="ghost" render={<Link href={`/interview/${matterId}/ancillary`} />}>
          Back
        </Button>
        <Button onClick={onContinue} disabled={pending}>
          {pending ? "Finishing…" : "Finish & continue"}
        </Button>
      </div>
    </div>
  );
}
