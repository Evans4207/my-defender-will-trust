"use client";

import { useState, useTransition } from "react";
import { generateDocumentsAction } from "@/lib/documents/generate";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GENERATION_ACK_LABEL } from "@/lib/legal";

export function GenerateButton({ matterId }: { matterId: string }) {
  const [ack, setAck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-input p-3 hover:bg-muted/40">
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
          className="mt-0.5 size-4 accent-[var(--color-brand-navy)]"
        />
        <span className="text-sm">{GENERATION_ACK_LABEL}</span>
      </label>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        className="w-full"
        disabled={pending || !ack}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await generateDocumentsAction(matterId, ack);
            if (res?.error) setError(res.error);
          })
        }
      >
        {pending ? "Generating your documents…" : "Generate my documents"}
      </Button>
    </div>
  );
}
