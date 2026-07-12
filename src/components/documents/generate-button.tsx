"use client";

import { useState, useTransition } from "react";
import { generateDocumentsAction } from "@/lib/documents/generate";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function GenerateButton({ matterId }: { matterId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button
        className="w-full"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await generateDocumentsAction(matterId);
            if (res?.error) setError(res.error);
          })
        }
      >
        {pending ? "Generating your documents…" : "Generate my documents"}
      </Button>
    </div>
  );
}
