import type { Metadata } from "next";
import { AttorneyReferralPicker } from "@/components/attorney-referral-picker";
import { SELF_HELP_DISCLAIMER, ATTORNEY_REVIEW_RECOMMENDATION } from "@/lib/legal";

export const metadata: Metadata = { title: "Find an attorney" };

export default function FindAnAttorneyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold">
        Find an attorney in your state
      </h1>
      <p className="mt-3 text-muted-foreground">
        {ATTORNEY_REVIEW_RECOMMENDATION} Most states offer a lawyer-referral
        service that can connect you with a licensed estate-planning attorney.
      </p>

      <div className="mt-8">
        <AttorneyReferralPicker />
      </div>

      <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
        {SELF_HELP_DISCLAIMER}
      </p>
    </div>
  );
}
