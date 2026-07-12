"use client";

import { useRef, useState, useTransition } from "react";
import { addFundingItemAction } from "@/lib/funding/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AddFundingForm({ matterId }: { matterId: string }) {
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
          const res = await addFundingItemAction(matterId, new FormData(form));
          if (res?.error) setError(res.error);
          else form.reset();
        });
      }}
      className="space-y-3"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input name="asset_label" placeholder="Asset (e.g. 123 Main St, Chase checking)" required className="flex-1" />
        <select
          name="category"
          defaultValue="other"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="real_estate">Real estate</option>
          <option value="account">Account</option>
          <option value="vehicle">Vehicle</option>
          <option value="business">Business</option>
          <option value="other">Other</option>
        </select>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
