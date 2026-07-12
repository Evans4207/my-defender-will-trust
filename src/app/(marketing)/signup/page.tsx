import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SELF_HELP_DISCLAIMER } from "@/lib/legal";

export const metadata: Metadata = { title: "Get Started" };

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <Card>
        <CardHeader>
          <h1 className="font-serif text-2xl font-semibold">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Account creation, email verification, Stripe checkout, and the
            access-code gate arrive in Phase 1.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Placeholder — sign-up form coming next phase.
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {SELF_HELP_DISCLAIMER}
          </p>
          <Button
            render={<Link href="/" />}
            variant="outline"
            className="w-full"
          >
            Back to home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
