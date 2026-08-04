'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ZodType } from 'zod';

// ---------------------------------------------------------------------------
// useZodForm — client-side validation from the schema the server already uses.
//
// Every form on the platform was `noValidate` with no client validation at all:
// each mistake cost a network round-trip, there was no feedback while typing,
// and nothing was said until the server said it. The Zod schemas in
// `src/lib/validation/` were the single source of truth for *rejection* but
// played no part in *guidance*.
//
// This shares them. The server keeps validating and remains authoritative —
// nothing here is a security boundary, and `setServerErrors` exists precisely
// so the server can still have the last word.
//
// Two deliberate choices:
//
// 1. Errors are computed over the whole object, never field-by-field, because
//    several schemas are discriminated unions (a buyer's fields depend on which
//    kind of buyer they are) and a field in isolation cannot be judged.
//
// 2. Nothing is shown until the first submit, after which everything is shown
//    and each message clears the moment its field becomes valid. Validating on
//    blur would tell someone their half-typed phone number is wrong while they
//    are still typing it; opening the form pre-covered in red is worse still.
//    Say nothing until asked, then say all of it, then get out of the way.
// ---------------------------------------------------------------------------

export type FieldErrors = Record<string, string[]>;

export interface IUseZodFormResult<T> {
  /** Current raw form values, as the inputs hold them. */
  values: Record<string, unknown>;
  /** Set one field, dropping any server verdict that value has now invalidated. */
  setValue: (field: string, value: unknown) => void;
  /** The error to display for a field, or undefined while the form is quiet. */
  errorFor: (field: string) => string | undefined;
  /** True when the schema accepts the current values. */
  isValid: boolean;
  /**
   * Validate for submission: starts showing errors and returns the parsed value
   * on success.
   */
  submit: () => { ok: true; data: T } | { ok: false };
  /** Field errors returned by the server, shown until the field changes. */
  setServerErrors: (errors: FieldErrors) => void;
  /** Reset values, errors and the shown/quiet state. */
  reset: (next?: Record<string, unknown>) => void;
}

/**
 * Move focus to the first field the form is complaining about.
 *
 * Preferred over disabling the submit button until the form is valid: a
 * disabled button gives no reason, cannot be focused, and leaves someone using
 * a screen reader with no way to find out what is wrong. Submitting always
 * works; it just lands you on the problem.
 */
export function focusFirstInvalid(form: HTMLFormElement | null): void {
  const invalid = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (!invalid) return;
  invalid.focus({ preventScroll: true });
  invalid.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

export function useZodForm<T>(
  schema: ZodType<T>,
  initialValues: Record<string, unknown> = {}
): IUseZodFormResult<T> {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrorsState] = useState<FieldErrors>({});

  const clientErrors: FieldErrors = useMemo(() => {
    const parsed = schema.safeParse(values);
    return parsed.success ? {} : (parsed.error.flatten().fieldErrors as FieldErrors);
  }, [schema, values]);

  const setValue = useCallback((field: string, value: unknown): void => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // A field the user is actively correcting should stop shouting at them.
    // The server's verdict on it is stale the moment the value changes; the
    // client's recomputes on its own from the new values.
    setServerErrorsState((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const errorFor = useCallback(
    (field: string): string | undefined => {
      // The server's message wins where it exists: it knows things the schema
      // cannot, such as a registration number already being in use.
      const fromServer = serverErrors[field]?.[0];
      if (fromServer) return fromServer;
      if (!showErrors) return undefined;
      return clientErrors[field]?.[0];
    },
    [serverErrors, showErrors, clientErrors]
  );

  const submit = useCallback((): { ok: true; data: T } | { ok: false } => {
    setShowErrors(true);
    const result = schema.safeParse(values);
    return result.success ? { ok: true, data: result.data } : { ok: false };
  }, [schema, values]);

  const setServerErrors = useCallback((errors: FieldErrors): void => {
    setServerErrorsState(errors);
    setShowErrors(true);
  }, []);

  const reset = useCallback((next: Record<string, unknown> = {}): void => {
    setValues(next);
    setShowErrors(false);
    setServerErrorsState({});
  }, []);

  return {
    values,
    setValue,
    errorFor,
    isValid: Object.keys(clientErrors).length === 0,
    submit,
    setServerErrors,
    reset,
  };
}
