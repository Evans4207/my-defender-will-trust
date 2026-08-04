"use client";

import { useActionState, useState } from "react";
import { createInviteAction, revokeInviteAction, type HouseholdActionState } from "@/lib/household/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initial: HouseholdActionState = {};

type LatestInvite = {
  id: string;
  email: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
} | null;

export function InvitePanel({
  latestInvite,
  partnerJoined,
  hasTrust,
}: {
  latestInvite: LatestInvite;
  partnerJoined: boolean;
  hasTrust: boolean;
}) {
  const [state, formAction] = useActionState(createInviteAction, initial);
  const [copied, setCopied] = useState(false);

  if (partnerJoined) {
    return (
      <Alert>
        <AlertDescription>
          Your partner has joined the household. Each of you now has your own login and
          owns your own documents
          {hasTrust ? "; the joint trust is shared between you" : ""}.
        </AlertDescription>
      </Alert>
    );
  }

  const copy = async () => {
    if (!state.link) return;
    try {
      await navigator.clipboard.writeText(state.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the link is selectable in the field */
    }
  };

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-3">
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Your spouse or partner&apos;s email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={latestInvite?.email ?? ""}
            placeholder="partner@example.com"
          />
        </div>
        <Button type="submit" className="w-full">
          {latestInvite?.status === "pending" ? "Re-issue invitation" : "Create invitation"}
        </Button>
      </form>

      {state.link && (
        <div className="space-y-2 rounded-md border border-accent/40 bg-accent/10 p-4">
          <p className="text-sm font-medium">
            {state.emailed
              ? "Invitation emailed. You can also share this link directly:"
              : "Email isn't set up yet — copy this link and send it to your partner:"}
          </p>
          <div className="flex gap-2">
            <Input readOnly value={state.link} onFocus={(e) => e.currentTarget.select()} />
            <Button type="button" variant="outline" onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The link expires in 14 days and can be re-issued at any time. It lets one person
            create their own account and join your household.
          </p>
        </div>
      )}

      {latestInvite && !state.link && (
        <div className="flex items-center justify-between rounded-md border border-input p-3 text-sm">
          <span>
            Invitation to <span className="font-medium">{latestInvite.email}</span> —{" "}
            <span className="capitalize">{latestInvite.status}</span>
          </span>
          {latestInvite.status === "pending" && (
            <form action={revokeInviteAction}>
              <input type="hidden" name="inviteId" value={latestInvite.id} />
              <Button type="submit" variant="ghost" size="sm">
                Cancel
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
