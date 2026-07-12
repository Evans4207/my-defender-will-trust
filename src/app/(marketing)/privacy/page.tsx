import type { Metadata } from "next";
import { ATTORNEY_REVIEW_REQUIRED } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold">Privacy Policy</h1>
      <div className="mt-4 rounded-md border border-dashed border-accent/50 bg-accent/10 p-4 text-sm">
        <strong>{ATTORNEY_REVIEW_REQUIRED}</strong> — Placeholder. Final Privacy
        Policy will be drafted and approved by outside counsel before launch. It
        will cover data retention, deletion, and user-initiated account deletion
        (build plan §8).
      </div>
    </div>
  );
}
