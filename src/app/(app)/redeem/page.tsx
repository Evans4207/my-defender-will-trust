import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getEntitlement } from "@/lib/entitlements.server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RedeemForm } from "@/components/codes/redeem-form";

export const metadata: Metadata = { title: "Enter your access code" };

export default async function RedeemPage() {
  const entitlement = await getEntitlement();
  if (entitlement.unlocked) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <h1 className="font-serif text-2xl font-semibold">
            Enter your access code
          </h1>
          <p className="text-sm text-muted-foreground">
            Your code unlocks your account and applies any partner discount.
          </p>
        </CardHeader>
        <CardContent>
          <RedeemForm />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have a code?{" "}
            <Link
              href="/gate"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Choose a package instead
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
