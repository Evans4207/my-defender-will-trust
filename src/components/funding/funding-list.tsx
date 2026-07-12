"use client";

import { useTransition } from "react";
import {
  toggleFundingRetitledAction,
  removeFundingItemAction,
} from "@/lib/funding/actions";
import { Button } from "@/components/ui/button";

export type FundingItem = {
  id: string;
  asset_label: string;
  category: string | null;
  retitled: boolean;
};

export function FundingList({
  matterId,
  items,
}: {
  matterId: string;
  items: FundingItem[];
}) {
  const [pending, start] = useTransition();

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No assets yet — add one below.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 p-3">
          <label className="flex flex-1 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={item.retitled}
              disabled={pending}
              onChange={(e) =>
                start(() =>
                  toggleFundingRetitledAction(item.id, matterId, e.target.checked),
                )
              }
              className="size-4 accent-[var(--color-brand-navy)]"
            />
            <span className={item.retitled ? "text-muted-foreground line-through" : ""}>
              {item.asset_label}
              {item.category && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {item.category.replace(/_/g, " ")}
                </span>
              )}
            </span>
          </label>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => start(() => removeFundingItemAction(item.id, matterId))}
            className="text-destructive hover:text-destructive"
          >
            Remove
          </Button>
        </li>
      ))}
    </ul>
  );
}
