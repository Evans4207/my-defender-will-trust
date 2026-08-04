import type { Metadata } from "next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <Card>
      <CardHeader>
        <h1 className="font-serif text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Log in to continue where you left off.
        </p>
      </CardHeader>
      <CardContent>
        <LoginForm next={next} />
      </CardContent>
    </Card>
  );
}
