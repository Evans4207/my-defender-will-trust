import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <Card>
        <CardHeader>
          <h1 className="font-serif text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Login is wired up in Phase 1 (Supabase Auth — email/password + magic
            link).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Placeholder — login form coming next phase.
          </div>
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
