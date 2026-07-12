import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-brand-navy-deep text-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-3">
          <Button
            render={<Link href="/login" />}
            variant="ghost"
            className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            Log in
          </Button>
          <Button
            render={<Link href="/signup" />}
            className="bg-accent text-accent-foreground hover:bg-brand-gold-bright"
          >
            Get Started
          </Button>
        </nav>
      </div>
    </header>
  );
}
