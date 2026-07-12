import type { Metadata } from "next";
import { getUser } from "@/lib/auth/user";
import { DeleteAccount } from "@/components/account/delete-account";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await getUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Account</h1>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold">Profile</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            <span className="text-muted-foreground">Email:</span>{" "}
            <span className="font-medium">{user?.email}</span>
          </p>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold text-destructive">
            Delete account
          </h2>
          <p className="text-sm text-muted-foreground">
            This permanently deletes your account and all associated data —
            documents, vault files, interview answers, and subscription records.
            This cannot be undone. If you have an active paid membership, cancel it
            first in the billing portal.
          </p>
        </CardHeader>
        <CardContent>
          <DeleteAccount />
        </CardContent>
      </Card>
    </div>
  );
}
