import Link from "next/link";
import { Shield } from "@/components/brand/shield";
import { SELF_HELP_DISCLAIMER } from "@/lib/legal";
import { hasVisibleEntries } from "@/lib/faq/content";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-brand-navy-deep text-white/80">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-2 text-white">
              <Shield className="h-6 w-auto text-accent" />
              <span className="font-serif text-base font-semibold">
                My Defender Will &amp; Trust
              </span>
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/50">
              Protection Before Panic
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
            {hasVisibleEntries() && (
              <Link className="hover:text-white" href="/faq">
                FAQ
              </Link>
            )}
            <Link className="hover:text-white" href="/states">
              State Availability
            </Link>
            <Link className="hover:text-white" href="/find-an-attorney">
              Find an Attorney
            </Link>
            <Link className="hover:text-white" href="/terms">
              Terms of Service
            </Link>
            <Link className="hover:text-white" href="/privacy">
              Privacy Policy
            </Link>
            <Link className="hover:text-white" href="/login">
              Log in
            </Link>
          </nav>
        </div>

        {/* Self-help disclaimer — a core feature, shown site-wide (§8). */}
        <div className="mt-8 rounded-md border border-white/10 bg-white/5 p-4">
          <p className="text-xs leading-relaxed text-white/70">
            <span className="font-semibold text-white/90">
              Self-help disclaimer:
            </span>{" "}
            {SELF_HELP_DISCLAIMER}
          </p>
        </div>

        <p className="mt-6 text-xs text-white/40">
          © 2026 My Defender Will &amp; Trust. Not a law firm. Self-help document
          preparation software.
        </p>
      </div>
    </footer>
  );
}
