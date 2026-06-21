'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button, Alert, Input } from '@/components/app';
import { passwordSchema } from '@/lib/validation/onboardingSchema';

// SCR-AUTH-RESET — set a new password from an emailed link (AUTH_ONBOARDING_FLOW_V2
// §10). Public. The raw token rides in the query string; the new password is
// validated client-side (same rule as onboarding) before POSTing to confirm.
export default function ResetPasswordPage(): React.ReactElement {
  return (
    <Suspense fallback={null}>
      <ResetContent />
    </Suspense>
  );
}

function ResetContent(): React.ReactElement {
  const token = useSearchParams().get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const p = passwordSchema.safeParse(password);
    if (!p.success) {
      setPasswordError(p.error.issues[0]?.message ?? 'Invalid password');
      return;
    }
    if (password !== confirm) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordError('');
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const code = (data as { code?: string }).code;
        setError(
          code === 'RESET_TOKEN_INVALID'
            ? 'This reset link is invalid or has expired. Request a new one.'
            : ((data as { error?: string }).error ?? 'Could not reset your password.')
        );
        return;
      }
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="theme-app flex min-h-screen items-center justify-center bg-app-canvas px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-1">
          <span className="app-h2 text-app-ink">Umoja</span>
          <span className="app-h2 text-app-brand">Hub</span>
        </div>

        <div className="rounded-app-card border border-app-hairline bg-app-card p-6 sm:p-8">
          {done ? (
            <>
              <h1 className="app-h1 mb-1 text-app-ink">Password updated</h1>
              <p className="app-body text-app-muted">
                Your password has been reset. You can now sign in with your new password.
              </p>
              <Link
                href="/auth/login"
                className="app-body-strong mt-6 inline-block text-app-brand hover:underline"
              >
                Go to sign in
              </Link>
            </>
          ) : !token ? (
            <>
              <h1 className="app-h1 mb-1 text-app-ink">Invalid reset link</h1>
              <p className="app-body text-app-muted">
                This link is missing its reset token. Request a new one to continue.
              </p>
              <Link
                href="/auth/forgot-password"
                className="app-body-strong mt-6 inline-block text-app-brand hover:underline"
              >
                Request a new link
              </Link>
            </>
          ) : (
            <>
              <h1 className="app-h1 mb-1 text-app-ink">Choose a new password</h1>
              <p className="app-body mb-6 text-app-muted">
                Set the password you&apos;ll use to sign in.
              </p>

              {error && (
                <div className="mb-4">
                  <Alert tone="danger">{error}</Alert>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="New password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={passwordError || undefined}
                  hint="At least 8 characters, including uppercase, lowercase, and a number."
                  autoComplete="new-password"
                />
                <Input
                  label="Confirm password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
                <Button
                  type="submit"
                  size="lg"
                  isLoading={loading}
                  disabled={loading || !password || !confirm}
                  className="w-full"
                >
                  Reset password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
