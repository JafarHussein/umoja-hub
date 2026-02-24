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

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (!result?.ok) {
        setError('Invalid email or password. Please check your credentials and try again.');
        return;
      }

      // Fetch the session to read the role and redirect accordingly
      const session = await getSession();
      const role = session?.user?.role as Role | undefined;
      const destination = role ? (DASHBOARD_BY_ROLE[role] ?? '/dashboard') : '/dashboard';
      router.push(destination);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

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

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={!email || !password}
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
