"use client";

import { useActionState } from "react";
import { acceptInviteAction, type HouseholdActionState } from "@/lib/household/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initial: HouseholdActionState = {};

/** Member B confirms acceptance. The raw token is carried in a hidden field. */
export function AcceptPanel({ token }: { token: string }) {
  const [state, formAction] = useActionState(acceptInviteAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <input type="hidden" name="token" value={token} />
      <Button type="submit" className="w-full">
        Join the household
      </Button>
    </form>
  );
}
