"use client";

import { useActionState } from "react";
import { redeemCodeAction, type RedeemState } from "@/lib/codes/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initial: RedeemState = {};

export function RedeemForm() {
  const [state, formAction] = useActionState(redeemCodeAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="code">Access code</Label>
        <Input
          id="code"
          name="code"
          placeholder="DFND-XXXX-XXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="font-mono tracking-wider uppercase"
          required
        />
        <p className="text-xs text-muted-foreground">
          Provided by your partner organization.
        </p>
      </div>
      <Button type="submit" className="w-full">
        Unlock my account
      </Button>
    </form>
  );
}
