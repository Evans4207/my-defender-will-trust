import type { Metadata } from "next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <Card>
      <CardHeader>
        <h1 className="font-serif text-2xl font-semibold">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Start protecting your family in minutes.
        </p>
      </CardHeader>
      <CardContent>
        <SignupForm next={next} />
      </CardContent>
    </Card>
  );
}
