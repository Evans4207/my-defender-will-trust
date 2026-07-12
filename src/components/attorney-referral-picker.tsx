"use client";

import { useState } from "react";
import { US_STATES, STATE_NAMES } from "@/lib/interview/states";
import { referralFor } from "@/lib/attorney-referrals";
import { SelectField } from "@/components/interview/fields";
import { Button } from "@/components/ui/button";

export function AttorneyReferralPicker({ initialState = "" }: { initialState?: string }) {
  const [state, setState] = useState(initialState);
  const referral = state ? referralFor(state) : null;

  return (
    <div className="space-y-4">
      <SelectField
        label="Your state"
        value={state}
        onChange={setState}
        options={US_STATES.map((s) => ({ value: s.code, label: s.name }))}
      />
      {referral && (
        <div className="rounded-md border border-border p-4">
          <p className="text-sm text-muted-foreground">
            {referral.national
              ? `We'll add a ${STATE_NAMES[state]} bar referral link soon. In the meantime, the American Bar Association's directory can help you find local legal help:`
              : `${STATE_NAMES[state]} offers a lawyer-referral service:`}
          </p>
          <Button
            className="mt-3"
            render={
              <a href={referral.url} target="_blank" rel="noopener noreferrer" />
            }
          >
            Find an attorney →
          </Button>
        </div>
      )}
    </div>
  );
}
