'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';

function ResetPasswordForm(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      router.replace('/auth/forgot-password');
    }
  }, [token, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      router.push('/auth/login');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
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
          type="password"
          label="New password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          required
        />

        <Input
          type="password"
          label="Confirm new password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          disabled={!newPassword || !confirmPassword}
          className="w-full mt-2"
        >
          Reset password
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <span className="font-heading font-semibold text-t2 text-text-primary">Umoja</span>
          <span className="font-heading font-semibold text-t2 text-accent-green">Hub</span>
        </div>

        <div className="bg-surface-elevated border border-white/5 rounded p-6">
          <h1 className="font-heading font-semibold text-t2 text-text-primary mb-1">
            Set new password
          </h1>
          <p className="font-body text-t5 text-text-secondary mb-6">
            Choose a strong password for your account.
          </p>

          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="mt-4 text-center font-body text-t5 text-text-secondary">
          <Link
            href="/auth/login"
            className="text-accent-green hover:opacity-80 transition-all duration-150"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
