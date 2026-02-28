'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Role } from '@/types';

const DASHBOARD_BY_ROLE: Record<Role, string> = {
  FARMER: '/dashboard/farmer/listings',
  BUYER: '/marketplace',
  STUDENT: '/dashboard/student/projects/new',
  LECTURER: '/dashboard/lecturer/reviews/pending',
  ADMIN: '/dashboard/admin/verification-queue',
};

function validateEmail(value: string): string {
  if (!value.trim()) return 'Email address is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address.';
  return '';
}

function validatePassword(value: string): string {
  if (!value) return 'Password is required.';
  return '';
}

export default function LoginPage(): React.ReactElement {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Per-field errors (shown after blur or submit attempt)
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Whether the user has already tried submitting (show all errors after first attempt)
  const [submitted, setSubmitted] = useState(false);

  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function handleEmailBlur(): void {
    setEmailError(validateEmail(email));
  }

  function handlePasswordBlur(): void {
    setPasswordError(validatePassword(password));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitted(true);
    setApiError('');

    // Run client-side validation first
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (!result?.ok) {
        setApiError('Incorrect email or password. Check your credentials and try again.');
        return;
      }

      const session = await getSession();
      const role = session?.user?.role as Role | undefined;
      const destination = role ? (DASHBOARD_BY_ROLE[role] ?? '/dashboard') : '/dashboard';
      router.push(destination);
    } catch {
      setApiError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Show a gentle "complete the form" prompt if they click submit before touching fields
  const showCompletionHint = submitted && (emailError || passwordError);

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <span className="font-heading font-semibold text-t2 text-text-primary">Umoja</span>
          <span className="font-heading font-semibold text-t2 text-accent-green">Hub</span>
        </div>

        {/* Card */}
        <div className="bg-surface-elevated border border-white/5 rounded p-6">
          <h1 className="font-heading font-semibold text-t2 text-text-primary mb-1">
            Sign in
          </h1>
          <p className="font-body text-t5 text-text-secondary mb-6">
            Enter your credentials to access your dashboard.
          </p>

          {apiError && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 rounded-sm bg-red-950/40 border border-red-800/50 font-body text-t5 text-red-400"
            >
              {apiError}
            </div>
          )}

          {showCompletionHint && !apiError && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 rounded-sm bg-yellow-950/40 border border-yellow-800/50 font-body text-t5 text-yellow-400"
            >
              Please fix the errors below before signing in.
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(validateEmail(e.target.value));
              }}
              onBlur={handleEmailBlur}
              error={emailError}
              autoComplete="email"
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(validatePassword(e.target.value));
              }}
              onBlur={handlePasswordBlur}
              error={passwordError}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center font-body text-t5 text-text-secondary">
          No account?{' '}
          <Link
            href="/auth/register"
            className="text-accent-green hover:opacity-80 transition-all duration-150"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
