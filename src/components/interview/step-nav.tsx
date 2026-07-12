"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

/** Footer nav for a step: error, autosave indicator, Back / Save & exit / Continue. */
export function StepNav({
  prevHref,
  error,
  saving,
  pending,
  onContinue,
  continueLabel = "Continue",
}: {
  prevHref: string | null;
  error: string | null;
  saving: boolean;
  pending: boolean;
  onContinue: () => void;
  continueLabel?: string;
}) {
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-3">
          {prevHref ? (
            <Button variant="ghost" render={<Link href={prevHref} />}>
              Back
            </Button>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground">
            {saving ? "Saving…" : "Saved"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href="/dashboard" />}>
            Save &amp; exit
          </Button>
          <Button onClick={onContinue} disabled={pending}>
            {pending ? "Saving…" : continueLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
