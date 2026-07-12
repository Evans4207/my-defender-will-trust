"use client";

import { useState } from "react";
import { deleteAccountAction } from "@/lib/account/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function DeleteAccount() {
  const [confirm, setConfirm] = useState("");

  return (
    <form action={deleteAccountAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="confirm">
          Type <span className="font-mono font-semibold">DELETE</span> to confirm
        </Label>
        <Input
          id="confirm"
          name="confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="off"
          className="max-w-xs"
        />
      </div>
      <Button type="submit" variant="destructive" disabled={confirm !== "DELETE"}>
        Permanently delete my account
      </Button>
    </form>
  );
}
