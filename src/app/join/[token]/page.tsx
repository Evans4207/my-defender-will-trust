import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyHousehold } from "@/lib/household/data";
import { AcceptPanel } from "@/components/household/accept-panel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SELF_HELP_DISCLAIMER } from "@/lib/legal";

export const metadata: Metadata = { title: "Join your household" };

/**
 * Public invite landing (deliberately OUTSIDE the (app) auth gate so an invited
 * partner can see it before they have an account). We do not look the invite up
 * here — the raw token is validated server-side by accept_household_invite when
 * they confirm — so no privileged read is needed just to render.
 */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const next = `/join/${token}`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If the viewer already belongs to a household, accepting can only fail
  // (their own invite, or one already used). Rather than a naked button that
  // returns an error on click, tell them plainly where they stand — this is the
  // common case when someone re-opens an already-used link or clicks their own.
  const existingHousehold = user ? await getMyHousehold() : null;

  if (existingHousehold) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <Card>
          <CardHeader>
            <h1 className="font-serif text-2xl font-semibold">
              You&apos;re already part of a household
            </h1>
            <p className="text-sm text-muted-foreground">
              {existingHousehold.role === "a"
                ? "This is your own household. Share your invite link with your spouse or partner so they can join — they'll create their own account from it."
                : "You've already joined this household. Your documents are in your dashboard."}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              render={
                <Link href={existingHousehold.role === "a" ? "/household" : "/dashboard"} />
              }
            >
              {existingHousehold.role === "a" ? "Manage your household" : "Go to your documents"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <h1 className="font-serif text-2xl font-semibold">
            You&apos;ve been invited to a household plan
          </h1>
          <p className="text-sm text-muted-foreground">
            Someone has invited you to join their estate plan on My Defender Will &amp; Trust.
            You&apos;ll get <span className="font-medium">your own account</span> and{" "}
            <span className="font-medium">your own documents</span> — the will that names you is
            yours to reach, not locked inside someone else&apos;s login.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <AcceptPanel token={token} />
          ) : (
            <div className="space-y-3">
              <p className="text-sm">
                First, create your own account (or log in) — then you&apos;ll come right back
                here to join.
              </p>
              <Button
                className="w-full"
                render={<Link href={`/signup?next=${encodeURIComponent(next)}`} />}
              >
                Create my account
              </Button>
              <Button
                variant="outline"
                className="w-full"
                render={<Link href={`/login?next=${encodeURIComponent(next)}`} />}
              >
                I already have an account
              </Button>
            </div>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">
            {SELF_HELP_DISCLAIMER}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
