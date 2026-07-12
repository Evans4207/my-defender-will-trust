"use client";

import { Button } from "@/components/ui/button";

/**
 * Generic add/remove list for repeatable groups (children, beneficiaries,
 * assets, …). Each item is edited via a partial-patch updater.
 */
export function Repeatable<T>({
  items,
  onChange,
  blank,
  addLabel,
  emptyHint,
  renderItem,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  blank: () => T;
  addLabel: string;
  emptyHint?: string;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
}) {
  const add = () => onChange([...items, blank()]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<T>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  return (
    <div className="space-y-3">
      {items.length === 0 && emptyHint && (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      )}
      {items.map((item, i) => (
        <div key={i} className="space-y-2 rounded-md border border-input p-3">
          {renderItem(item, (patch) => update(i, patch), i)}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(i)}
              className="text-destructive hover:text-destructive"
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        + {addLabel}
      </Button>
    </div>
  );
}
