"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  type = "text",
  placeholder,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  type?: string;
  placeholder?: string;
  id?: string;
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  rows = 3,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
  rows?: number;
  id?: string;
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
  placeholder = "Select…",
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
  placeholder?: string;
  id?: string;
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-input p-3 hover:bg-muted/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 accent-[var(--color-brand-navy)]"
      />
      <span className="space-y-0.5">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

export function RadioCards({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; description?: string }[];
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <button
              type="button"
              key={o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                "rounded-md border p-3 text-left transition-colors",
                selected
                  ? "border-accent bg-accent/10 ring-1 ring-accent"
                  : "border-input hover:bg-muted/40",
              )}
            >
              <span className="block text-sm font-medium">{o.label}</span>
              {o.description && (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {o.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Field>
  );
}
