"use client";

import { useActionState } from "react";
import { joinWaitlistAction, type WaitlistState } from "@/lib/waitlist";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initial: WaitlistState = {};

export function WaitlistForm({
  state,
  defaultEmail = "",
}: {
  state: string;
  defaultEmail?: string;
}) {
  const [result, formAction] = useActionState(joinWaitlistAction, initial);

  if (result.message) {
    return (
      <Alert>
        <AlertDescription>{result.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="state" value={state} />
      {result.error && (
        <Alert variant="destructive">
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="waitlist-email">Email me when it opens</Label>
        <Input
          id="waitlist-email"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          placeholder="you@example.com"
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Join the waitlist
      </Button>
    </form>
  );
}
