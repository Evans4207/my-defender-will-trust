import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";

export function AppHeader({ email }: { email?: string | null }) {
  return (
    <header className="w-full border-b border-white/10 bg-brand-navy-deep text-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-3">
          {email && (
            <span className="hidden text-sm text-white/70 sm:inline">
              {email}
            </span>
          )}
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
