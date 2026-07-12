"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { saveDraftAction, completeStepAction } from "./actions";

/**
 * Client state for one interview step: local values, debounced autosave (so a
 * refresh loses nothing), and a validated submit that advances the wizard.
 */
export function useStepForm<T extends Record<string, unknown>>(opts: {
  matterId: string;
  stepKey: string;
  initial: T;
}) {
  const [values, setValues] = useState<T>(opts.initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pending, startTransition] = useTransition();

  const latest = useRef(values);
  const firstRun = useRef(true);

  // Keep a ref to the newest values for use inside debounced/async closures.
  useEffect(() => {
    latest.current = values;
  }, [values]);

  const setField = useCallback((key: keyof T, value: T[keyof T]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setMany = useCallback((patch: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  }, []);

  // Debounced autosave. Skips the initial mount (nothing has changed yet).
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(async () => {
      setSaving(true);
      await saveDraftAction(opts.matterId, opts.stepKey, latest.current);
      setSaving(false);
    }, 900);
    return () => clearTimeout(t);
  }, [values, opts.matterId, opts.stepKey]);

  const submit = useCallback(() => {
    setError(null);
    startTransition(async () => {
      // On success this redirects (never returns); on failure it returns an error.
      const res = await completeStepAction(
        opts.matterId,
        opts.stepKey,
        latest.current,
      );
      if (res?.error) setError(res.error);
    });
  }, [opts.matterId, opts.stepKey]);

  return { values, setField, setMany, error, saving, pending, submit };
}
