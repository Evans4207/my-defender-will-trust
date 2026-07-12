"use client";

import { useRef, useState, useTransition } from "react";
import { uploadVaultFileAction } from "@/lib/vault/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function VaultUploadForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      ref={ref}
      onSubmit={(e) => {
        e.preventDefault();
        const form = ref.current;
        if (!form) return;
        start(async () => {
          setError(null);
          const res = await uploadVaultFileAction(new FormData(form));
          if (res?.error) setError(res.error);
          else form.reset();
        });
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <input
        type="file"
        name="file"
        required
        className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload"}
      </Button>
      {error && (
        <Alert variant="destructive" className="sm:ml-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
