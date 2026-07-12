import { cn } from "@/lib/utils";

/**
 * Defender shield motif. Uses `currentColor` so it inherits text color
 * (navy on light surfaces, gold/parchment on dark). The inner check-mark
 * evokes "protection / verified".
 */
export function Shield({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="My Defender shield"
      className={cn("h-8 w-auto", className)}
    >
      <path
        d="M24 2 4 9v18c0 12.5 8.4 22.1 20 27 11.6-4.9 20-14.5 20-27V9L24 2Z"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M16 27.5 22 34l11-13"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
