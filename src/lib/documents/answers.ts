/** Shared helpers for reading interview answers in document assemblers. */
export type Answers = Record<string, Record<string, unknown>>;

export const s = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

export function list<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export type Child = { name?: unknown; isMinor?: unknown };
export type Beneficiary = { name?: unknown; percent?: unknown };
