'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.status === 429) {
        setError('Too many requests. Please try again later.');
        return;
      }

      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <span className="font-heading font-semibold text-t2 text-text-primary">Umoja</span>
          <span className="font-heading font-semibold text-t2 text-accent-green">Hub</span>
        </div>

        <div className="bg-surface-elevated border border-white/5 rounded p-6">
          <h1 className="font-heading font-semibold text-t2 text-text-primary mb-1">
            Forgot password
          </h1>

          {sent ? (
            <p className="font-body text-t5 text-text-secondary">
              If an account exists for <strong className="text-text-primary">{email}</strong>, you
              will receive a password reset link shortly.
            </p>
          ) : (
            <>
              <p className="font-body text-t5 text-text-secondary mb-6">
                Enter your email address and we will send you a reset link.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mb-4 px-4 py-3 rounded-sm bg-red-950/40 border border-red-800/50 font-body text-t5 text-red-400"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <Input
                  type="email"
                  label="Email address"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  disabled={!email}
                  className="w-full mt-2"
                >
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-4 text-center font-body text-t5 text-text-secondary">
          Remember your password?{' '}
          <Link
            href="/auth/login"
            className="text-accent-green hover:opacity-80 transition-all duration-150"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
