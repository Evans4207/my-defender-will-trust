"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  loginAction,
  magicLinkAction,
  type ActionState,
} from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SubmitButton } from "./submit-button";
import { FormAlert } from "./form-alert";

const initial: ActionState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(loginAction, initial);
  const [magicState, magicAction] = useActionState(magicLinkAction, initial);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        <FormAlert state={state} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <SubmitButton>Log in</SubmitButton>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <form action={magicAction} className="space-y-3">
        <FormAlert state={magicState} />
        <div className="space-y-2">
          <Label htmlFor="magic-email">Email me a magic link</Label>
          <Input
            id="magic-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>
        <Button type="submit" variant="outline" className="w-full">
          Send magic link
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
