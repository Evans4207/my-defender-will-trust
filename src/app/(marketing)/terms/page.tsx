import type { Metadata } from "next";
import { ATTORNEY_REVIEW_REQUIRED, SELF_HELP_DISCLAIMER } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold">Terms of Service</h1>
      <div className="mt-4 rounded-md border border-dashed border-accent/50 bg-accent/10 p-4 text-sm">
        <strong>{ATTORNEY_REVIEW_REQUIRED}</strong> — Placeholder. Final Terms of
        Service will be drafted and approved by outside counsel before launch.
      </div>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        {SELF_HELP_DISCLAIMER}
      </p>
    </div>
  );
}
