import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getEntitlement } from "@/lib/entitlements.server";
import {
  getMyHousehold,
  getHouseholdMembers,
  getLatestInvite,
} from "@/lib/household/data";
import { startHouseholdAction } from "@/lib/household/actions";
import { InvitePanel } from "@/components/household/invite-panel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your household" };

export default async function HouseholdPage() {
  const entitlement = await getEntitlement();
  const household = await getMyHousehold();

  // A joint trust only exists on a plan that includes the Trust package. On a
  // Will-only plan there is nothing shared between the two accounts, so the
  // "joint trust" language must not appear.
  const hasTrust = entitlement.packages.includes("trust");

  // No household yet: only an entitled owner can start one.
  if (!household) {
    if (!entitlement.unlocked) redirect("/gate");
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <h1 className="font-serif text-2xl font-semibold">Add your spouse or partner</h1>
            <p className="text-sm text-muted-foreground">
              A household lets each of you keep your own login and your own documents
              {hasTrust ? ", with the joint trust shared between you" : ""}. You stay the
              account that manages the plan.
            </p>
          </CardHeader>
          <CardContent>
            <form action={startHouseholdAction}>
              <Button type="submit" className="w-full">
                Start a household
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const members = await getHouseholdMembers(household.householdId);
  const partnerJoined = members.some((m) => m.role === "b");

  // Member B view — they don't manage invitations.
  if (household.role === "b") {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <h1 className="font-serif text-2xl font-semibold">Your household</h1>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You&apos;re part of a household. Your own documents are in your dashboard
              {hasTrust ? "; the joint trust is shared with the account holder" : ""}.
            </p>
            <Button variant="outline" render={<Link href="/dashboard" />}>
              Go to your documents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const latestInvite = await getLatestInvite(household.householdId);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Your household</h1>
        <p className="mt-1 text-muted-foreground">
          Invite your spouse or partner. They create their own account and own their own
          documents{hasTrust ? ", and share the joint trust with you" : ""}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold">Invite your partner</h2>
        </CardHeader>
        <CardContent>
          <InvitePanel
            latestInvite={latestInvite}
            partnerJoined={partnerJoined}
            hasTrust={hasTrust}
          />
        </CardContent>
      </Card>

      <Button variant="ghost" render={<Link href="/dashboard" />}>
        Back to dashboard
      </Button>
    </div>
  );
}
