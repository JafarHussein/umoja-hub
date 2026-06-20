'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Alert, Input } from '@/components/app';

// SCR-AUTH-FORGOT — request a password reset link (AUTH_ONBOARDING_FLOW_V2 §10).
// Public. The API is anti-enumeration, so on any valid submit we show the same
// generic "check your email" confirmation regardless of whether the account
// exists.
export default function ForgotPasswordPage(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!email) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) {
        setError('Too many requests. Please try again later.');
        return;
      }
      setSent(true);
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
          {sent ? (
            <>
              <h1 className="app-h1 mb-1 text-app-ink">Check your email</h1>
              <p className="app-body text-app-muted">
                If an account exists for <span className="text-app-ink">{email}</span>, we&apos;ve
                sent a link to reset your password. It expires in 30 minutes.
              </p>
              <Link
                href="/auth/login"
                className="app-body-strong mt-6 inline-block text-app-brand hover:underline"
              >
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h1 className="app-h1 mb-1 text-app-ink">Reset your password</h1>
              <p className="app-body mb-6 text-app-muted">
                Enter the email on your account and we&apos;ll send you a reset link.
              </p>

              {error && (
                <div className="mb-4">
                  <Alert tone="danger">{error}</Alert>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                />
                <Button
                  type="submit"
                  size="lg"
                  isLoading={loading}
                  disabled={loading || !email}
                  className="w-full"
                >
                  Send reset link
                </Button>
              </form>

              <p className="app-meta mt-6 text-app-faint">
                Remembered it?{' '}
                <Link href="/auth/login" className="text-app-brand hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
