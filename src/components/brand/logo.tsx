import Link from "next/link";
import { cn } from "@/lib/utils";
import { Shield } from "./shield";

/**
 * Primary lockup: shield motif + "My Defender Will & Trust" wordmark.
 * Text-based wordmark keeps it crisp and theme-aware on any surface, and
 * correctly names this Will & Trust product (a sub-brand of My Defender Plan).
 */
export function Logo({
  className,
  href = "/",
  showTagline = false,
}: {
  className?: string;
  href?: string | null;
  showTagline?: boolean;
}) {
  const content = (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Shield className="h-9 w-auto text-accent" />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-lg font-semibold tracking-tight">
          My Defender <span className="text-accent">Will &amp; Trust</span>
        </span>
        {showTagline && (
          <span className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Protection Before Panic
          </span>
        )}
      </span>
    </span>
  );

  if (href === null) return content;

  return (
    <Link href={href} className="inline-flex" aria-label="My Defender Will & Trust — home">
      {content}
    </Link>
  );
}
