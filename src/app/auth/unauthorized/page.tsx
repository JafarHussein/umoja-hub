'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Role } from '@/types';

const DASHBOARD_BY_ROLE: Record<Role, string> = {
  FARMER: '/dashboard/farmer/listings',
  BUYER: '/marketplace',
  STUDENT: '/dashboard/student/projects/new',
  LECTURER: '/dashboard/lecturer/reviews/pending',
  ADMIN: '/dashboard/admin/verification-queue',
};

const ROLE_LABELS: Record<Role, string> = {
  FARMER: 'Farmer',
  BUYER: 'Buyer',
  STUDENT: 'Student',
  LECTURER: 'Lecturer',
  ADMIN: 'Admin',
};

export default function UnauthorizedPage(): React.ReactElement {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const dashboardUrl = user?.role
    ? (DASHBOARD_BY_ROLE[user.role] ?? '/dashboard')
    : '/auth/login';

  const roleLabel = user?.role ? ROLE_LABELS[user.role] : null;

  function handleGoToDashboard(): void {
    router.push(dashboardUrl);
  }

  async function handleSignOut(): Promise<void> {
    await signOut({ callbackUrl: '/auth/login' });
  }

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {/* Error icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded border border-white/10 bg-surface-elevated mb-6">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-secondary"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className="font-heading font-semibold text-t2 text-text-primary mb-2">
          Access denied
        </h1>

        {isLoading ? (
          <p className="font-body text-t5 text-text-secondary mb-6">
            Checking your session&hellip;
          </p>
        ) : roleLabel ? (
          <p className="font-body text-t5 text-text-secondary mb-6">
            You are signed in as a{' '}
            <span className="font-mono text-text-primary">{roleLabel}</span> and do not have
            permission to access this section.
          </p>
        ) : (
          <p className="font-body text-t5 text-text-secondary mb-6">
            You do not have permission to access this page.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {user ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleGoToDashboard}
              className="w-full"
            >
              Go to my dashboard
            </Button>
          ) : (
            <Link href="/auth/login" className="block w-full">
              <Button variant="primary" size="lg" className="w-full">
                Sign in
              </Button>
            </Link>
          )}

          {user && (
            <Button
              variant="ghost"
              size="md"
              onClick={handleSignOut}
              className="w-full"
            >
              Sign out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
